let toggle_btn;
let prev_btn;
let next_btn;
let scroll_timeout;

window.onload=async ()=>{

  let invalid_url=false;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => { //check if correct link
    let current_url=new URL(tabs[0].url)
    if(!
      (current_url.host.includes("reddit") || current_url.host.includes("instagram")|| current_url.host.includes("twitter")) ){
      invalid_url=true;
      return;
    }
    else
      document.querySelector("#invalid").className="hidden";
  });
  if(invalid_url)
    return;
  
  // get stored data //
  chrome.storage.sync.get(['scroll_timeout'], function(result) {
    if(result.scroll_timeout==undefined)
      chrome.storage.sync.set({scroll_timeout:Math.trunc(scroll_timeout.value * 1000)});
    else
      scroll_timeout.value=result.scroll_timeout/1000;
  });

  prev_btn=document.querySelector("#prev_btn");
  toggle_btn=document.querySelector("#toggle_btn");
  next_btn=document.querySelector("#next_btn");
  scroll_timeout=document.querySelector("#scroll_timeout");

  prev_btn.addEventListener("click",(e)=>control_cmd("prev"));
  next_btn.addEventListener("click",(e)=>control_cmd("next"));
  toggle_btn.addEventListener("click",(e)=>{control_cmd("toggle_pause"); active=!active; set_btns()});


  scroll_timeout.addEventListener("keyup",validate);
  scroll_timeout.addEventListener("change",e=>validate(e,false,true));

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs)=>{
    chrome.tabs.sendMessage(tabs[0].id,{ "status":true }, (response)=>{
      if(!response)
        return;
      
      if("active" in response)
        active=response.active
        
      set_btns();
    });
  });

}
window.onbeforeunload = function(){
  chrome.storage.sync.set({scroll_timeout:Math.trunc(scroll_timeout.value*1000)});
}

//others
const validate=(e,to_int=false,set_value=false)=>{

  let temp_value=parseFloat(e.target.value);
  if(isNaN(e.target.value))
    return;

  if(e.target.value=="")
    temp_value=0;
  else if(e.target.value>100)
    temp_value=100;
  else if(e.target.value<0)
    temp_value=0

  if(to_int)
    temp_value=Math.trunc(e.target.value);

  if(set_value)
    e.target.value=temp_value;
  else
    chrome.storage.sync.set({[e.target.id]:(to_int?temp_value:temp_value*1000)});
  


}


function control_cmd(command){
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id,{ cmd: command});
  });

}

let active=false
function set_btns(){


  if(active){ //current paused
    toggle_btn.innerText="Playing";
    prev_btn.classList.remove("disabled");
    next_btn.classList.remove("disabled");
  }
  else{ //current running
    toggle_btn.innerText="Paused";
    prev_btn.classList.add("disabled");
    next_btn.classList.add("disabled");
  }
}