import axios from 'axios';
import { error } from 'console';
import dotenv from "dotenv"
//import cron from 'node-cron';
const token = process.env.TOKEN_AGENDOR
dotenv.config()
export interface followUp {
    idfunnel: number,
    id: number,
    message: string
 }
 let idStage: followUp

 export interface saveNote {
  date:any,
  message: string
}
const folowUpMessage1 = `Olá tudo bem?? 
Você demonstrou interesse em nossos closets mas nós não conseguimos conversar referente a ele ainda. 😕

Preciso que você me conte um pouco sobre a sua necessidade e problema de como guardar as roupas, para que eu possa te apresentar as melhores soluções com melhor custo-benefício.

Pode mandar um áudio ou vídeo se facilita para você! 
Aguardo aqui sua mensagem.` 

const folowUpMessage2 = `Oiii
Não estou conseguindo uma resposta sua. Quero ser bem honesto com você.
Tenho mais algumas pessoas interessadas para apresentar nosso produto e preciso dar continuidade 
no meu trabalho, mas você é prioridade para mim pois eu não tive uma resposta sua!
`
const folowUpMessage3 = `Olá, uma pena isso 😕 

Estava ansioso para mostrar como nossa empresa poderia resolver o seu problema de como guardar as roupas.

 Seria uma ótima saída para você também, mas, pela falta de resposta, acredito que este não seja mais uma prioridade no momento.
 Sendo assim, este será meu último contato para você.🙁 

Caso mude de ideia no futuro ou queria voltar a atacar os pontos que falei acima, fico a disposição. 😎
`



//////////////função para encontrar o usuario pelo mobile/////////////////
export async function getPerson(number: string) {
    let id: any;
try {
    let response = await axios.get(`https://api.agendor.com.br/v3/people?mobile_phone=${number}`, {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `${token}`
        },
    })
   id = response.data.data[0].id
   console.log(id)
    } catch (error) {
        //console.error('Erro na requisição:', error);
    }
   // console.log(fomratnum)
    return id
}

/////////////////função para pegar ID do negócio //////////////////////     
export async function getdeal(idPerson:number){
    let deal: any;
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://api.agendor.com.br/v3/people/${idPerson}/deals`,
      headers: { 
        'Authorization': 'Token 603364cc-5636-4f66-8911-62fd6466164b', 
      }
    };
    await axios.request(config)
    .then((response) => {
      //console.log(JSON.stringify(response.data));
      deal = response.data
      return deal
    })
    .catch((error) => {
      console.log(error);
    });
    return deal
    }

/////////////////função para pegar id da pessoa pelo mobile_phone, e retornar o ID do negócio com a função dealId //////////////////////     
export const getDealId = async(number: string) => {
  try{
    let idPerson = await getPerson(number)
    const dealId:any = await getdeal(idPerson)
     return dealId.data[0].id
    }
    catch {
      console.log(error)
    }
   }
     ///////////////atualiza os estagios do nedócio/////////////////
export async function updateStage(idDeal:number, idStage:number, funnel: number){
  console.log(`Atualizando estágio do negócio ${idDeal} para ${idStage}`);
    let data = JSON.stringify({
      "dealStage": idStage,
      "funnel": funnel
    });
  let config = {
    method: 'put',
    maxBodyLength: Infinity,
    url: `https://api.agendor.com.br/v3/deals/${idDeal}/stage`,
    headers: { 
      'Authorization': `${token}`, 
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data.data));
    console.log(`Atualizando estágio do negócio ${idDeal} para ${idStage}`);
  })
  .catch((error) => {
    console.log(error);
  });
  }
//////////////////////////////criar nota no histórico do cliente////////////////// 
export async function createNotePerson(number:string, chat:any){
    const personId = await getPerson(number)
    console.log(`Criando nota para o cliente ${personId}`);
    let data = JSON.stringify({
      "text": chat,
      "user": "784879"
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api.agendor.com.br/v3/people/${personId}/tasks`,
      headers: { 
        'Authorization': `${token}`, 
        'Content-Type': 'application/json', 
      },
      data : data
    };
    axios.request(config)
    .then((response) => {
      console.log(response.data.data);
      console.log(`Nota criada para o cliente ${personId}`);
    })
    .catch((error) => {
      console.log(error);
    });
    }

///////////////função para atualizat pessoa/////////////

export async function updatePerson (id:number, number:string){
  let data = JSON.stringify({
      "contact": {
        "mobile": number
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
    console.log(JSON.stringify(response.data.data));
  })
  .catch((error) => {
    console.log(error);
  })
  }

    ////////////////////////////////////função para criar pessoa caso não esteja cadastrada////////////////////////////
    export async function createPersonAndDeal(name:string, whatsapp:string, mobile:string) {
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
          const idpessoa = response.data.data.id
          await criarNegócioPessoa(idpessoa)
      } catch (error) {
          console.error('Erro ao criar pessoa:', error);
      }
  }
    
    ///////função para pegar o numero da pessoa pela id, utilizada para conseguir os dados da pessoa quando é enviado menssagem e negócio//////////////////
   export async function getNumber (id:any){
        let data = ''
        let config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: `https://api.agendor.com.br/v3/people?id=${id}`,
          headers: { 
            'Authorization': token, 
            'Content-Type': 'application/json', 
            
          },
          data : data
        };
        
        const response = await axios.request(config)
        return response 
        }

///////////função para criar negócio para pessoa//////////////////////   
   export const criarNegócioPessoa = async (id:number) =>{
    let data = JSON.stringify({
      "title": "Iniciar pre-atendimento",
      "dealStatusText": "ongoing",
      "funnel": 690725,
      "dealStage": 1,
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `https://api.agendor.com.br/v3/people/${id}/deals`,
      headers: { 
        'Authorization': `${token}`, 
        'Content-Type': 'application/json', 
      },
      data : data
    };
    
 await axios.request(config)
    .then((response) => {
      console.log(JSON.stringify(response.data));
    })
    .catch((error) => {
      console.log(error);
    });
  }
//////////////setar estágio do folow-up baseado na tentativa /////////////////////
 export function getStageIdBasedOnAttempt(attempt:number):followUp {
    if(attempt === 1){
       idStage = {
        idfunnel: 690725,
        id:2,
        message: folowUpMessage1
       }
    }
    if(attempt === 2){
        idStage = {
        idfunnel: 690725,
        id:3,
        message:folowUpMessage2
        }
     }
     if(attempt === 3){
        idStage = {
            idfunnel: 690725,
            id:4,
            message:folowUpMessage3
            }
  }
     return idStage
}
//////////////atuliza horario do negócio para os folow-ups/////////////////
export async function updateFollowUpTime(dealId:number, newTime:string) {
  let data = JSON.stringify({
    "startTime": newTime // Substitua por um valor de data/hora real
  });
  let config = {
    method: 'put', // Use 'put' ou 'patch' para atualizar
    url: `https://api.agendor.com.br/v3/deals/${dealId}`, // Substitua ${dealId} pelo ID real
    headers: { 
      'Content-Type': 'application/json', 
      'Authorization': 'Bearer YOUR_AUTH_TOKEN' // Substitua pelo seu token de autenticação
    },
    data: data
  };

  try {
    const response = await axios.request(config);
    console.log(JSON.stringify(response.data));
  } catch (error) {
    console.error(error);
  }
}
//////////////////funcao para fechar negócio como perdido//////////////////
export async function updateStatus(idDeal:number, status:string){
  console.log(`Atualizando status do negócio ${idDeal} para ${status}`);
    let data = JSON.stringify({
        "dealStatusText": `${status}`,
        });
let config = {
    method: 'put',
    maxBodyLength: Infinity,
    url: `https://api.agendor.com.br/v3/deals/${idDeal}/status`,
    headers: { 
      'Authorization': `${token}`, 
      'Content-Type': 'application/json', 
    },
    data : data
  };
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data));
    console.log(`Status do negócio ${idDeal} atualizado para ${status}`);
  })
  .catch((error) => {
    console.log(error);
  });
}
/*
cron.schedule('* * * * *', async () => {
  try {
      // Obtenha os clientes que precisam de follow-up do banco de dados
      const clientesParaFollowUp = await getClientesParaFollowUp();

      for (const cliente of clientesParaFollowUp) {
          // Verifique a data da última atualização e o número de tentativas
          // Realize as ações necessárias (por exemplo, enviar um novo follow-up)
      }
  } catch (error) {
      console.error('Erro ao executar a tarefa de follow-up:', error);
  }
});
*/

async function updateDealOwner(idDeal:number){
  console.log(`Atualizando usuario do negócio ${idDeal}`);
    let data = JSON.stringify({
      "ownerUser": 784879,
    });
  let config = {
    method: 'put',
    maxBodyLength: Infinity,
    url: `https://api.agendor.com.br/v3/deals/${idDeal}`,
    headers: { 
      'Authorization': `${token}`, 
      'Content-Type': 'application/json'
    },
    data : data
  };
  
  axios.request(config)
  .then((response) => {
    console.log(JSON.stringify(response.data.data));
    console.log(`Atualizando usuario do negócio ${idDeal}`);
  })
  .catch((error) => {
    console.log(error);
  });
  }





export async function updateNewDeal(idPerson: number) {
  let config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `https://api.agendor.com.br/v3/people/${idPerson}/deals`,
    headers: {
      'Authorization': `${token}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    let response = await axios.request(config);
    let dealId: any;

    for (const deal of response.data.data) {
      console.log(deal.dealStage.id);
      if (deal.dealStage.id === 2808506) {
        dealId = deal.id;
        break; // Adiciona um break aqui para sair do loop assim que encontrar o dealId desejado
      }
    }

    if (dealId) {
      await updateDealOwner(dealId);
    } else {
      console.log("Nenhum deal encontrado com o dealStage.id 2808506");
    }

  } catch (error) {
    console.log(error);
  }
}