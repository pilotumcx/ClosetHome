import axios from 'axios';
import { createClient } from 'redis';
import dotenv from "dotenv"
dotenv.config()

const token = process.env.TOKEN

export const clientRedis = createClient({
  username: 'default', // use your Redis user. More info https://redis.io/docs/management/security/acl/
  password: 'if15UdT65b9qApFybNtyAeaVyvuNGzPg', // use your password here
  socket: {
      host: 'redis-15132.c1.us-east1-2.gce.cloud.redislabs.com',
      port: 15132,
      tls: false,
  }
});


////////////////função para passar numero pro formato mobile////////////////
export function formatPhoneNumber(number: string): string {
    // Removendo o prefixo '+55'
    const nationalNumber = number.substring(3); 
  
    // Extraindo o código de área e o número local
    const areaCode = nationalNumber.substring(0, 2);
    const localNumber = nationalNumber.substring(2);
  
    // Formatando o número local no padrão 'XXXX-XXXX'
    const formattedLocalNumber = localNumber.substring(0, 4) + '-' + localNumber.substring(4);
  
    // Juntando tudo no formato desejado '(XX) XXXX-XXXX'
    return `(${areaCode}) ${formattedLocalNumber}`;
  }

//////////////função para encontrar o usuario pelo mobile/////////////////
  export async function getPerson(number: string) {
            let fomratnum;
        try {
            let response = await axios.get(`https://api.agendor.com.br/v3/people?mobile_phone=${number}`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
            })
           fomratnum = response.data.data[0].id
            console.log(fomratnum)
            } catch (error) {
                console.error('Erro na requisição:', error);
            }
           // console.log(fomratnum)
            return fomratnum
        }
////////////////////////////////////função para criar pessoa caso não esteja cadastrada////////////////////////////
        export async function createPerson(name: string, whatsapp:string, mobile: string) {
            const url = 'https://api.agendor.com.br/v3/people';
        
            const requestBody = {
                name: `${name}`,
                contact: {
                  mobile:`${mobile}`,
                  whatsapp:`${whatsapp}`
                },
            };
        
            try {
                const response = await axios.post(url, requestBody, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`
                    }
                });
                console.log('Pessoa criada com sucesso:', response.data.data);
            } catch (error) {
                console.error('Erro ao criar pessoa:', error);
            }
        }
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
        }
*/
///////////////////////////função para atualizar histórico da conversa////////////////////
export async function updatePerson (phone:string, message:string){
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