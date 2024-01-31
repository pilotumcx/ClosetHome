/* eslint-disable no-await-in-loop */
import { Message, Whatsapp, create } from "venom-bot"
import {getPerson} from './old/utilsold.js'
import {formatPhoneNumber} from './old/utilsold.js'
import {createPerson} from './old/utilsold.js'
import { updatePerson } from "./old/utilsold.js"
/*import { DataSource } from "typeorm";
import { SqlDatabase } from "langchain/sql_db";*/
//import {clientRedis} from './utils/utilsConrado.js'
 

/*let url = 'redis://default:R6YT99byN9V1qxvkOCUAx59I41xz1HC3@redis-15132.c1.us-east1-2.gce.cloud.redislabs.com:15132'
const redisClient:any = createClient({ url:url});
redisClient.on('error', (err:any) => console.log('Redis Client Error', err));*/

 async function query(data:any) {
  const response = await fetch(
    "https://flow.limemarketing.com.br/api/v1/prediction/9696d75e-0519-4270-bbad-690d59fdd50f",
      {
          method: "POST",
          headers: {
              "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
      }
  );
  const result = await response.json();
 // await redisClient.disconnect()
  //console.log(result)
  return result;
 
}
create({
  session: "mindbot",
  disableWelcome: true,
})
  .then(async (client: Whatsapp) => await start(client))
  .catch((err) => {
    console.log(err)
  })
  async function start(client: Whatsapp) {
    //let atendimentoEncerrado = false
    client.onMessage(async (message: Message) => {
      if (!message.body || message.isGroupMsg) return;
      
//const messageUser = `'role': user, 'content': ${message.body}`
      const searchNumber = message.from.substring(2).replace('@c.us', '');
      console.log(searchNumber);
      const idPerson = await getPerson(searchNumber);
      let customer = `+${message.from.replace('@c.us', '')}`;
      const mobile = formatPhoneNumber(customer);
      //await updatePerson(customer, messageUser)
      
      if (!idPerson) {
        // Se o cliente não estiver cadastrado, crie um novo cadastro.
       //await updatePerson(customer, messageUser)
        await createPerson(message.sender.pushname, customer, mobile);
        const apiResponse = await query({
          "question": `${message.body}`,
           "overrideConfig": {
            "sessionId": customer
          }
          });
        const assistantMessage = `'role' 'assistant', 'content':${apiResponse.text} `
       await updatePerson(customer, assistantMessage)
        await client.sendText(message.from, apiResponse.text);
      } else {
        // Se o cliente já estiver cadastrado, continue com o atendimento regular.
        console.log(idPerson);
        console.log(mobile);
        console.log(message.sender.pushname);

        // Obtenha a resposta da consulta à AP
       const apiResponse = await query({
        "question": `${message.body}`,
         "overrideConfig": {
            "sessionId": customer
          }
        
        });
      /*  const assistantMessage = `'role': 'assistant', 'content':'${apiResponse.text}' `
        await updatePerson(customer, assistantMessage)*/
        if (apiResponse.text.includes('1:30')) {
          await client.sendText(message.from, apiResponse.text);
          const assistantMessage = `role: 'assistant', 'content':'${apiResponse.text}' `
          await updatePerson(customer, assistantMessage)
          await client.sendFile(message.from, 'src/ConradoVideo.mp4', 'ConradoVideo.mp4', 'Video',);
        } else {
          await client.sendText(message.from, apiResponse.text);
          console.log(apiResponse)
          //const assistantMessage = `role: assistant, content:${apiResponse.text} `
          //await updatePerson(customer, assistantMessage)
        }
                }
                
    });
    
  }
