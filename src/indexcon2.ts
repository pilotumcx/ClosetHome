  ////////////////importaç~~oes ///////////////////////
  import { Message, Whatsapp, create } from "venom-bot";
  import mime from 'mime-types';
  import fs from 'fs';
  import express, { Request, Response } from 'express';
  import bodyParser from 'body-parser';
  import {sendVideoWithRetry, audio, convertToBrasiliaTimezone} from './utils/utils.js'
  import { updateStatus, followUp, getDealId, getStageIdBasedOnAttempt, updateStage, saveNote, createNotePerson, getPerson, createPerson, criarNegócioPessoa } from "./utils/utilsagendor.js";
  ///////////////////////////////declaração de variaveis globais/////////////////////
  const app = express();
  app.use(bodyParser.json());
  let messageBuffer: Record<string, string[]> = {};
  let messageTimer: Record<string, NodeJS.Timeout> = {};
  const bufferTime = 10000; 
  let clientsAwaitingResponse:any = {}
  let followUpInfo:any = {};
  let clientGlobal: Whatsapp;
  const PORT = 3002;
  let clientMessages:saveNote[] = [] 
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
    console.log(attempt)
    try {
    if (attempt > 3) {
      await updateStatus(followUpInfo[customer].dealId, "lost")
      // Encerra após 3 tentativas
      return;
    }
    // Define um timer para 24 horas (86400000 milissegundos)
    followUpInfo[customer].timer = setTimeout(async () => {
      const followUpDetails:followUp = getStageIdBasedOnAttempt(attempt);
      // Atualiza o estágio no Agendor
      await updateStage(followUpInfo[customer].dealId, followUpDetails.id);
      // Envie a mensagem de follow-up
      await clientGlobal.sendText(`${customer}@c.us`, followUpDetails.message);
      // Agenda o próximo follow-up
      scheduleFollowUp(customer, attempt + 1);
    },300000);
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
        let customer = `${message.from.replace('@c.us', '')}`;
        customer = customer.substring(2)
        let idperson = await getPerson(customer)
        console.log(customer)
        let idNegocio = await getDealId(customer)
        console.log(idNegocio)
        
        if (clientsAwaitingResponse[customer]) {
          clearTimeout(followUpInfo[customer].timer);
          delete clientsAwaitingResponse[customer];
          delete followUpInfo[customer];
      } 

      if(!idperson){
        const response:any = await createPerson(message.sender.pushname, `+55${customer}`, customer);
        console.log(response.data.data.id)
        await criarNegócioPessoa (response.data.data.id)
        }

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
          console.log(message.sender.pushname);
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
              if (apiResponse.text.includes('todas as informações agora')) {
                await client.sendText(message.from, apiResponse.text);
                console.log(message.from)
                await updateStage(idNegocio, 5);
            } else if (apiResponse.text.includes('1:30')) {
                await client.sendText(message.from, apiResponse.text);
                await sendVideoWithRetry(client, message.from, 'src/ConradoVideo.mp4', 'ConradoVideo.mp4', `Vou encaminhar suas informações para o setor de atendimento. Foi um prazer te ajudar até agora, e estou confiante de que podemos continuar alinhando nossos objetivos. Entre hoje e amanha, nossos atendentes entrarão em contato com você`);
                
                try {
                    const Messages = await client.getAllMessagesInChat(message.from, true, false); 
                    const promises = Messages.map(async (message) => {
                        clientMessages.push({date:convertToBrasiliaTimezone(message.t), message:message.body});
                        // Se você tiver mais operações assíncronas a serem feitas com 'message', inclua-as aqui
                    });
                    await Promise.all(promises);
                    console.log(clientMessages);
                    await createNotePerson(customer, JSON.stringify(clientMessages));
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
      session: "ClosetHome",
      disableWelcome: true,
      
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
              const number = `${response.telefone.replace('@c.us', '')}`
                let customer = number.substring(2)
                let idNegocio = await getDealId(customer)
                console.log(idNegocio)          
                if (clientGlobal) {
                  const apiResponse = await query({
                    "question": `responda essa menssagem exatamente como está a seguir:${response.mensagem}`,
                    "overrideConfig": {
                        "sessionId": customer,
                      }
                    });
                    await clientGlobal.sendText(response.telefone, apiResponse.text);
                }   
            res.status(200).send('Webhook recebido com sucesso!');
            clientsAwaitingResponse[customer] = true;
            followUpInfo[customer] = { dealId: idNegocio, timer: null };
            scheduleFollowUp(customer);
        } catch (error) {
            console.error('Erro ao processar o webhook:', error);
            res.status(500).send('Erro interno do servidor');
        }
    });
    app.listen(PORT,  () => {
        console.log(`Servidor escutando na porta ${PORT}`);
    });
    