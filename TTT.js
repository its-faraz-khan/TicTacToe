let btns=document.querySelectorAll(".box");
let resetBtn=document.querySelector(".btn");
let newGameBtn =document.querySelector(".btn1");
let msgContainer=document.querySelector(".win-container");
let msg=document.querySelector("#msg");

let currentPlayerO=true; //Game will start with O 

let count=0;  //to check draw and the count

const arr2= [
    [0,1,2],
    [3,4,5],
    [6,7,8],
    [0,3,6],
    [1,4,7],
    [2,5,8],
    [2,4,6],
    [0,4,8],
    [3,4,6],
];
 const disableBoxes= ()=>{
        for(let box of btns){
            box.disabled=true;
        }
    }
     const enableBoxes= ()=>{
        for(let box of btns){
            box.disabled=false;
            box.innerText="";
        }
    }

const resetButton=()=>{
    currentPlayerO=true;
    enableBoxes();
msgContainer.classList.add("hide");
}


function showWinner(winner)
{
msg.innerText=`Congratulations! Winner is ${winner}`;
msgContainer.classList.remove("hide");
disableBoxes();
}


function checkWinner(){
    let winnerFound=false;
    for(let elements of arr2){
    let p1= btns[elements[0]].innerText;
    let p2= btns[elements[1]].innerText;
    let p3= btns[elements[2]].innerText;
    if(p1!=""&& p2!=""&& p3!="")
    {
        if(p1 === p2 && p2 === p3 )
        {
            showWinner(p1);
            winnerFound=true;
        }
    }
    }
    if (!winnerFound && count === 9) {
        msg.innerText = `No Winner! It's a Draw`;
        msgContainer.classList.remove("hide");
        disableBoxes();
    }
}

btns.forEach((box)=>{
box.addEventListener("click",()=>{
if(currentPlayerO)
{
    box.innerText="0";
    box.style.color="#E75480";
    currentPlayerO= false;
    count++;
}
else{
box.innerText="X";
 box.style.color="#000000";
currentPlayerO=true;
count++;
}
box.disabled=true;
checkWinner();
    })
});

newGameBtn.addEventListener("click", resetButton);
resetBtn.addEventListener("click", resetButton);

