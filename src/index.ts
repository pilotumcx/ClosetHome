  ////////////////importaç~~oes ///////////////////////
  import { Message, Whatsapp, create } from "venom-bot";
  import mime from 'mime-types';
  import fs from 'fs';
  import express, { Request, Response } from 'express';
  import bodyParser from 'body-parser';
  import {sendVideoWithRetry, audio, convertToBrasiliaTimezone, ajustarNumeroSeNecessario, formatarNumero} from './utils/utils.js'
  import {updatePerson, updateStatus, followUp, getDealId, getStageIdBasedOnAttempt, updateStage, /*saveNote,*/ createNotePerson, getPerson, createPersonAndDeal/*, getdeal*/ } from "./utils/utilsagendor.js";
  ///////////////////////////////declaração de variaveis globais/////////////////////

  function delay(ms:any) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
  const app = express();
  app.use(bodyParser.json());
  let messageBuffer: Record<string, string[]> = {};
  let messageTimer: Record<string, NodeJS.Timeout> = {};
  const bufferTime = 10000; 
  let clientsAwaitingResponse:any = {}
  let followUpInfo:any = {};
  let clientGlobal: Whatsapp;
  const PORT = 3002;
  //let clientMessages:saveNote[] = [] 
/////////////funcao que verificar se esta em horario comercial//////
  function isBusinessHours() {
    const now = new Date();
    const hour = now.getHours();
    return hour >= 8 && hour < 18;
  }
  /////////////////////////função API com o Flwise///////////////////////////////
  async function query(data: any) {
    try {
        const response = await fetch(
            "https://flow.limemarketing.com.br/api/v1/prediction/ef89b3e8-574c-42de-9017-bb7a6f5cdf64",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            }
        );
        if (!response.ok) {
            throw new Error(`Erro na API: ${response.status}`);
        }
        const result = await response.json();
        console.log(result)
        return result;
    } catch (error) {
        console.error('Erro na função query:', error);
        throw error; // Propagar o erro para ser tratado onde a função é chamada
    }
  }
  ///////////////////////função do folowup/////////////////////////
  async function scheduleFollowUp(customer: string, attempt = 1) {
    console.log(attempt);
    try {
      if (attempt > 3) {
        await updateStatus(followUpInfo[customer].dealId, "lost");
        // Encerra após 3 tentativas
        return;
      }   
      // Verifica se está em horário comercial
      if (isBusinessHours()) {
        // Define um timer para 24 horas (86400000 milissegundos)
        followUpInfo[customer].timer = setTimeout(async () => {
          const followUpDetails: followUp = getStageIdBasedOnAttempt(attempt);
          // Atualiza o estágio no Agendor
          await updateStage(followUpInfo[customer].dealId, followUpDetails.id, followUpDetails.idfunnel);
          // Envie a mensagem de follow-up
          await clientGlobal.sendText(`${customer}@c.us`, followUpDetails.message);
          // Agenda o próximo follow-up
          scheduleFollowUp(customer, attempt + 1);
        }, 120000);
      }
    } catch (error) {
      console.error(`Erro em scheduleFollowUp para o cliente ${customer}:`, error);
    }
  }
  ///////////////////////////função start client/////////////////
    async function start(client: Whatsapp) {
      clientGlobal = client
    /////////////////função gatilho quando cliente manda menssagem//////////////////// 
      client.onMessage(async (message: Message) => {
      if (message.isMedia === true || message.isMMS === true) return;  
      ////formatações de numero para o agendor////////////////
        let customer = ajustarNumeroSeNecessario(message.from).replace('@c.us', '');
        customer = customer.substring(2)
        console.log(customer)
        let idperson = await getPerson(customer)
//////////verifica se a pessoa existe, se não exisitir, cria pessoa e negócio////////////////
        if(!idperson){
          const numberVerified = ajustarNumeroSeNecessario(message.from)
          const mobile = formatarNumero(numberVerified)
          await createPersonAndDeal(message.sender.pushname, `+55${customer}`, mobile);
          }
  ////////////consdição para parar folow-up////////////////
        if (clientsAwaitingResponse[customer]) {
          clearTimeout(followUpInfo[customer].timer);
          delete clientsAwaitingResponse[customer];
          delete followUpInfo[customer];
          console.log("folow-up cancelado")
      } 
///////////////atribui id do negócio ///////////////////
        let idNegocio = await getDealId(customer)
        console.log(idNegocio)
///////////////verificar se é imagem ou video ////////////////////////
        const mimeType = message.mimetype || '';
        const isMedia = mimeType.startsWith('image/') || mimeType.startsWith('video/');
        let input:any;

        if (isMedia) {
          // Código para lidar com mensagens de mídia (imagem ou vídeo)
          await client.sendText(message.from, "obrigado pelas imagens")
          console.log('Mensagem é uma imagem ou vídeo, não será processada pelo chat.');
      } else {
        if(message.body){
          input = message.body
          console.log(input)
        } else {
          try {
          const buffer = await client.decryptFile(message);
          console.log(mime.extension(message.mimetype))
          const fileName = `${customer}.${mime.extension(message.mimetype)}`;
          fs.writeFile(fileName, buffer, (err: any) => {
                console.log(err);
            })
            console.log(fileName)
            input = await audio(fileName)
            console.log(input)
            } catch (error) {
              console.error(`Erro ao processar o arquivo de mídia:`, error);
            }
          }
        }
          if (!messageBuffer[message.from]) {
            messageBuffer[message.from] = [];
        }
        // Adiciona a mensagem ao buffer
        messageBuffer[message.from].push(input);
        // Reinicia o timer se já existir
        if (messageTimer[message.from]) {
            clearTimeout(messageTimer[message.from]);
        }
        // Configura um novo timer
        messageTimer[message.from] = setTimeout(async () => {
            // Concatena as mensagens do buffer
            const fullMessage = messageBuffer[message.from].join(' ');
          // Limpa o buffer e o timer
            messageBuffer[message.from] = [];
            delete messageTimer[message.from];
            
              const apiResponse = await query({
                  "question": `${fullMessage}`,
                  "overrideConfig": {
                      "sessionId": customer,
                  }
              });

              if (apiResponse.text.includes("Olá, Seja muito bem-vindo à Closet Home. Sou o assistente virtual do pré-atendimento. Estou aqui para auxiliá-lo neste primeiro contato. Em seguida, encaminharei você para um de nossos atendentes. Posso fazer algumas perguntas?")) {
               await client.sendText(message.from, apiResponse.text);
               await client.sendImage(message.from,'src/welcomeImage.jpg', 'WelcomeImage', '');
                console.log(message.from)
              }
              if (apiResponse.text.includes('todas as informações agora')) {
                await client.sendText(message.from, apiResponse.text);
                console.log(message.from)
                await updateStage(idNegocio, 5, 69075);
            } else if (apiResponse.text.includes('1:30')) {
                await client.sendText(message.from, apiResponse.text);
                await sendVideoWithRetry(client, message.from, 'src/ConradoVideo.mp4', 'ConradoVideo.mp4', `Vou encaminhar suas informações para o setor de atendimento. Foi um prazer te ajudar até agora, e estou confiante de que podemos continuar alinhando nossos objetivos. Entre hoje e amanha, nossos atendentes entrarão em contato com você, abraços.`);
                
                try {
                  const Messages: any = await client.getAllMessagesInChat(message.chatId, true, false); 
                   
              const clientMessages: any[] = Messages.map((message: any) => {
              return {date:`[${convertToBrasiliaTimezone(message.t)}]`, message:`${message.sender.pushname}: ${message.body}`};
              // Removido async, pois não há operações assíncronas sendo feitas aqui
          });
                    let resultado: string = clientMessages.map(msg => JSON.stringify(msg)).join('\n');
                    console.log(resultado)
                    await createNotePerson(customer, resultado);
                    await updateStatus(idNegocio, "won");
                } catch (error) {
                    console.error(`Erro ao processar mensagens:`, error);
                }
            } else {
                await client.sendText(message.from, apiResponse.text);
                console.log(apiResponse);
            }},bufferTime);
      })
    }
    /////////////////////////função que cria o cliente////////////////////////////
    create({
      session: "Mindbot",
      disableWelcome: true,
      //browserPathExecutable: 'C:\Users\pc\Desktop\experimentos\botwhats\closetHomeOcean\ClosetHome\Chrome\Application\chrome.exe',
    })
      .then(async (client: Whatsapp) => await start(client))
      .catch((err) => {
        console.log(err)
      })
      /////////////////webhook que recebe cliente ao se cadastrar////////////////
      app.post('/closethome2', async (req: Request, res: Response) => {
      
        try {
            console.log('Webhook recebido:', req.body);
            const response = req.body
            const numberlength = response.telefone.length
            let customer = `${response.telefone.replace('@c.us', '').substring(2)}`

             await delay (10000)


            console.log(req.body)
            const idPerson = await getPerson(customer)
            console.log(customer)
            console.log(idPerson)
            console.log(response.telefone)
            console.log(numberlength)
              
              console.group(customer)
              const numberVerified = ajustarNumeroSeNecessario(response.telefone)
              const mobile = formatarNumero(numberVerified)
              const idNegocio = await getDealId(customer)
              const numberVerified2 = numberVerified.replace('@c.us', '').substring(2) 
              console.log(idNegocio) 
              if(numberlength>17){  
               const idPessoa = await getPerson(customer)
                await updatePerson(idPessoa, mobile)    
              }  
                if (clientGlobal) {
                  const apiResponse = await query({
                    "question": `responda essa menssagem exatamente como está a seguir:${response.mensagem}`,
                    "overrideConfig": {
                        "sessionId": numberVerified2,
                      }
                    });
                    await clientGlobal.sendText(numberVerified, apiResponse.text);
                    await clientGlobal.sendImage(numberVerified,'src/welcomeImage.jpg', 'WelcomeImage', '');
                }   
            res.status(200).send('Webhook recebido com sucesso!');
            clientsAwaitingResponse[numberVerified2] = true;
            console.log(clientsAwaitingResponse)
            console.log(numberVerified2)
            followUpInfo[numberVerified2] = { dealId: idNegocio, timer: null };
            scheduleFollowUp(numberVerified2);
        } catch (error) {
            console.error('Erro ao processar o webhook:', error);
            res.status(500).send('Erro interno do servidor');
        }
    });
    app.listen(PORT,  () => {
        console.log(`Servidor escutando na porta ${PORT}`);
    });
    