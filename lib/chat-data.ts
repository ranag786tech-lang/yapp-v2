export type Conversation = { id:string; name:string; initials:string; color:string; preview:string; time:string; unread?:number; online?:boolean; pinned?:boolean };
export type Message = { id:string; text:string; time:string; from:"me"|"them"; status?:"sent"|"delivered"|"read" };
export const conversations: Conversation[] = [
 {id:"maya",name:"Maya Chen",initials:"MC",color:"#edb4a1",preview:"That sounds perfect. See you then!",time:"10:42 AM",unread:2,online:true,pinned:true},
 {id:"team",name:"The Weekend Crew",initials:"WC",color:"#a6c7eb",preview:"Alex: Shared a new photo",time:"9:18 AM",unread:5},
 {id:"sam",name:"Sam Rivera",initials:"SR",color:"#d9b4e4",preview:"Let me know what you think",time:"Yesterday",online:true},
 {id:"jordan",name:"Jordan Lee",initials:"JL",color:"#f0d49c",preview:"Voice message · 0:42",time:"Yesterday"},
 {id:"family",name:"Family",initials:"FA",color:"#a8d8c1",preview:"Mom: Dinner at 7?",time:"Tuesday",unread:1},
];
export const messages: Record<string, Message[]> = { maya:[{id:"1",text:"Hey! Are we still on for coffee tomorrow?",time:"10:36 AM",from:"them"},{id:"2",text:"Absolutely. I found a new place near the park that looks lovely.",time:"10:39 AM",from:"me",status:"read"},{id:"3",text:"Ooh, send me the name!",time:"10:40 AM",from:"them"},{id:"4",text:"It’s called Fern & Finch. I’ll grab us a table for 11?",time:"10:41 AM",from:"me",status:"read"},{id:"5",text:"That sounds perfect. See you then!",time:"10:42 AM",from:"them"}],team:[{id:"1",text:"Shared a new photo",time:"9:18 AM",from:"them"}],sam:[{id:"1",text:"Let me know what you think",time:"Yesterday",from:"them"}],jordan:[{id:"1",text:"Voice message · 0:42",time:"Yesterday",from:"them"}],family:[{id:"1",text:"Dinner at 7?",time:"Tuesday",from:"them"}]};
