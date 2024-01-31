import {Message, Whatsapp, create } from "venom-bot"
//import mime from 'mime-types'


/*import fs from 'fs'
import OpenAI from "openai";

const openai = new OpenAI();*/
/*async function query(data:any) {
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
  //console.log(result)
  return result;
 
}*/

/*async function main(path:string) {
  const transcription = await openai.audio.transcriptions.create({
    file:  fs.createReadStream(path),
    model: "whisper-1",
  });
  return transcription.text
}
*/
create({
    session: "mindbot",
    disableWelcome: true,
  })
    .then(async (client: Whatsapp) => await start(client))
    .catch((err) => {
      console.log(err)
    })
    async function start(client: Whatsapp) {
    client.onMessage( async (message:Message) => {
       if (message.isMedia === true || message.isMMS === true) return
       await client.clearChatMessages(message.from);
       
      /* let customer = `+${message.from.replace('@c.us', '')}`;
              if(message.body){
                const respostaApi = await query({"question": `${message.body}`})
                console.log(respostaApi)
                await client.sendText(message.from, respostaApi.text)
              } else {
          const buffer = await client.decryptFile(message); 
          console.log(mime.extension(message.mimetype))

          // At this point you can do whatever you want with the buffer
          // Most likely you want to write it into a file
          const fileName = `${customer}.${mime.extension(message.mimetype)}`;
           fs.writeFile(fileName, buffer, (err: any) => {
                console.log(err);
            })
            const response = await main(fileName)
            console.log(response)
            const respostaApi = await query({"question": `${response}`})
            console.log(respostaApi)
            await client.sendText(message.from,respostaApi.text)
        }*/
      }
        
        )}
        
    

          
