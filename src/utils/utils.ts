import dotenv from "dotenv"
import fs from 'fs'
import OpenAI from "openai";
import moment from 'moment-timezone';
//import {createClient} from 'redis'

dotenv.config()
const openai = new OpenAI();



export async function sendVideoWithRetry(client: any, to: string, filePath: string, fileName: string, caption: string, maxRetries: number = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
      try {
          await client.sendFile(to, filePath, fileName, caption);
          console.log(`Vídeo enviado com sucesso para ${to}`);
          break; // Sair do loop se o vídeo for enviado com sucesso
      } catch (error) {
          console.error(`Erro ao enviar vídeo para ${to}:`, error);
          retries++;

          if (retries >= maxRetries) {
              await client.sendText(to, "Desculpe, não consegui enviar o vídeo. Vou tentar novamente mais tarde.");
              // Aqui você pode implementar uma lógica para tentar novamente mais tarde, se desejar
              break;
          }
      }
  }
}


/*let url = 'redis://:y3Wn9WgPbMZ7jPEnTC8weaql5YkhavyuWdH0sGo1w9aFHdLt6vhwK9BGN8aZds7v@144.126.139.99:33604/1'
const redisClient:any = createClient({ url:url});
redisClient.on('error', (err:any) => console.log('Redis Client Error', err));

export async function saveInitialMessage(customer:string, message:string) {
  const initialMessage = {
    type: "ai",
    data: {
      content: message,
      additional_kwargs: {}
    }
  };

  try {
    await redisClient.connect();
    await redisClient.lPush(`${customer}`, JSON.stringify(initialMessage));
    console.log('Mensagem inicial salva no Redis');
  } catch (error) {
    console.error('Erro ao salvar no Redis:', error);
  } finally {
    await redisClient.quit();
  }
}
*/

//////função para transcrever udio em texto///////////////
export async function audio(path:string) {
  const transcription = await openai.audio.transcriptions.create({
    file:  fs.createReadStream(path),
    model: "whisper-1",
  });
  return transcription.text
} 
/*export async function query(data:any) {
  const response = await fetch(
    "https://flow.limemarketing.com.br/api/v1/prediction/f28195c5-4bc0-4afc-8de8-51909cb5bece",
      {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
      }
  );
  const result = await response.json();
  return result;
}
*/
/////////função que converte o timestamp do venom para o formato de data e hora de Brasilia //////////////////
export function convertToBrasiliaTimezone(timestamp: number): string {
  try {
      // Converter o timestamp para milissegundos e ajustar para o fuso horário de Brasília
      const brasiliaTime = moment(timestamp * 1000).tz('America/Sao_Paulo').format('DD/MM/YYYY HH:mm:ss');
      return brasiliaTime;
  } catch (error) {
      console.error('Erro ao converter o timestamp:', error);
      return '';
  }
}

// função para passar o numero para o formato de envio do whatsapp
/*function formatPhoneNumberFirst(number: string): string {
  // Remove caracteres não numéricos
  let cleaned = number.replace(/\D+/g, '');

  // Verifica se o número começa com '55' (código do Brasil), e remove se necessário
  if (cleaned.startsWith('55')) {
      cleaned = cleaned.substring(2);
  }
  return cleaned + '@c.us';
}*/
////////////////função para passar numero pro formato mobile////////////////
export function formatarNumero(numero: string): string {
  // Extrai os dígitos do número, removendo caracteres não numéricos
  const digitos = numero.replace(/\D/g, '');

  // Verifica se o número tem o comprimento esperado (12 dígitos)
  if (digitos.length === 12) {
    // Extrai o DDD, os quatro primeiros dígitos após o DDD, e os últimos quatro dígitos
    const ddd = digitos.substring(2, 4);
    const inicio = digitos.substring(4, 8);
    const final = digitos.substring(8, 12);

    // Monta o número no formato desejado
    return `(${ddd}) ${inicio}-${final}`;
  } else {
    // Retorna uma mensagem de erro ou o próprio número caso não tenha o formato esperado
    return "Formato de número inválido";
  }
}


///////////////////////////////////////// função para atualizar o mobile do cliente caso vanha conversa pelo whatsapp

///////////////////////////////////////
/*async function sendMessage(client: any, contact:any, message: string) {
  try {
    await client.sendText(`${contact.phoneNumber}`, message);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
  }
}
*/



          
          //////////função que recebe o cliente e os dados da função do create do venom-bot
        /*  export function processApiResponse(client: any, data:any) {
            if (data && data.data && data.data.length > 0) {
              data.data.forEach(async (item:any) => {
                console.log(item.person.id); 
                const person= await getNumber(item.person.id)
                const numero:any = formatPhoneNumberFirst(person.data.data[0].contact.whatsapp)
                await sendMessage(client, numero, "A Closet Home desejamum bom domingo a todos os clientes." )
                console.log('Text Closet home')
                await updatePerson(item.person.id, formatPhoneNumberMobile(person.data.data[0].contact.whatsapp))
              });
            } else {
              console.log("Nenhum dado encontrado ou resposta inválida");
            }
          }*/
          ///////////função que verifica se tem novos negócios /////////////
        /*  export async function checkForUpdates(client:any, lastRequestTime:any) {
            let config = {
              method: 'get',
              maxBodyLength: Infinity,
              url: `https://api.agendor.com.br/v3/deals/stream?since=${lastRequestTime}`,
              headers: { 
                'Authorization': token, 
                'Content-Type': 'application/json', 
              }
            };
            try {
              const response = await axios.request(config);
              lastRequestTime = new Date().toISOString(); // Atualiza o horário da última requisição
              console.log("Última requisição em:", lastRequestTime);
          
              // Processa a resposta
              if (response.data) {
                if (Array.isArray(response.data)) {
                  // Trata o caso em que a resposta é um array de objetos
                  response.data.forEach(item => processApiResponse(client, item));
                } else {
                  // Trata o caso em que a resposta é um objeto único
                  processApiResponse(client, response.data);
                }
              } else {
                // Trata o caso em que a resposta é vazia
                console.log("Nenhum dado novo para processar");
              }
            } catch (error) {
              console.error("Erro ao verificar atualizações:", error);
            }
          }*/



///////////////////função para buscar histórico da conversa///////////////////
/*async function gethistory(id:number){
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: `https://api.agendor.com.br/v3/people/${id}?withCustomFields=true`,
            headers: { 
              'Authorization': `${token}`, 
              'Content-Type': 'application/json'
            },
           // data : data
          };
          
         const response:any[] = await axios.request(config)
          return response
        }*/

///////////////////////////função para atualizar histórico da conversa////////////////////
/*export async function updatePerson (phone:string, message:string){
    console.log(message)
 
    try {
      //await clientRedis.connect();
      const redisKey = `customers:${phone}`;
      let chatLog = [];
  
      // Tenta obter o chatLog existente do Redis
      const existingChatLog = await clientRedis.get(redisKey);
  
      if (existingChatLog) {
          // Se já existir um chatLog, parse e verifique se é um array
          const parsedChatLog = JSON.parse(existingChatLog);
          if (Array.isArray(parsedChatLog)) {
              chatLog = parsedChatLog;
  
  }
  }
  // Criando um objeto para a mensagem com conteúdo e hora
  const messageObject = {
      content: message,
      timestamp: new Date().toISOString() // Data e hora no formato ISO
  };
  // Adiciona a nova mensagem ao chatLog
  chatLog.push(messageObject);
  // Salva o chatLog atualizado de volta no Redis
  await clientRedis.set(redisKey, JSON.stringify(chatLog));
  } catch (error) {
  console.error("Erro ao conectar ou manipular dados no Redis:", error);
  // Trate o erro conforme necessário
  } finally {
  //await clientRedis.disconnect();
  }
  }


         /* let data = JSON.stringify({
              "customFields": {
              "customerchat": chatLog
            }
          });
          let config = {
            method: 'put',
            maxBodyLength: Infinity,
            url: `https://api.agendor.com.br/v3/people/${id}`,
            headers: { 
              'Authorization': `${token}`, 
              'Content-Type': 'application/json'
            },
            data : data
          };
          
          axios.request(config)
          .then((response) => {
            console.log(JSON.stringify(response.data));
          })
          .catch((error) => {
            console.log(error);
          })*/
//////////////////////menssagem folowup///////////////////
//let ultimaMensagemTimestamp:any = null;
//let atendimentoEncerrado = false; // Variável para rastrear o status do atendimento

/*export function enviarMensagemDoVenomBot() {
    if (atendimentoEncerrado) {
        console.log("Uma pena que não vamos poder dar continuidade no seu atendimento neste momento, mas quando puder avançar nesta questão do closet estaremos a disposição.");
        return; // Sai da função se o atendimento estiver encerrado
    }

    console.log("Uma pena que não vamos poder dar continuidade no seu atendimento neste momento, mas quando puder avançar nesta questão do closet estaremos a disposição..");
    ultimaMensagemTimestamp = new Date();
}

export function verificarEEnviarMensagem() {
    const agora:any = new Date();
    const umDia:any = 24 * 60 * 60 * 1000;

    if (ultimaMensagemTimestamp && agora - ultimaMensagemTimestamp > umDia) {
        enviarMensagemDoVenomBot();
    }
}

/*function encerrarAtendimento() {
    atendimentoEncerrado = true; // Atualiza o status para encerrado
    console.log("Atendimento foi encerrado.");
}*/

// Exemplo de uso
/*
enviarMensagemDoVenomBot();
setInterval(verificarEEnviarMensagem, 60 * 60 * 1000);*/

export function ajustarNumeroSeNecessario(numero: string): string {
  // Separa a base numérica do sufixo
  let number = numero;
  const [baseNumerica, sufixo] = numero.split('@');

  // Determina o comprimento esperado para números sem o '9' extra
  const comprimentoPadrao = 12; // Ajuste conforme necessário

  // Verifica se o número atende aos critérios para remoção do '9'
  if (baseNumerica.length === comprimentoPadrao + 1 && baseNumerica.startsWith('55') && baseNumerica[4] === '9') {
      // Remove o '9' extra e reconstrói o número com o sufixo
      number =  baseNumerica.substring(0, 4) + baseNumerica.substring(5) + '@' + sufixo;
  }

  // Retorna o número original se não atender aos critérios
  return number;
}