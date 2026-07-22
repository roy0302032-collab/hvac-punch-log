let punchList = JSON.parse(
    localStorage.getItem("punchList")
) || [];


let selectedPhotos = [];

let selectedVideo = "";

let editIndex = -1;




const addBtn = document.getElementById("addBtn");

const formArea = document.getElementById("formArea");

const saveBtn = document.getElementById("saveBtn");

const list = document.getElementById("list");

const photoInput = document.getElementById("photo");

const preview = document.getElementById("preview");

const videoInput = document.getElementById("video");

const videoPreview = document.getElementById("videoPreview");






renderList();

updateCount();







// 新增按鈕

addBtn.addEventListener("click",()=>{


    editIndex=-1;


    formArea.style.display="block";


    document.getElementById("reportDate").value =

    new Date().toISOString().split("T")[0];


});








// 儲存

saveBtn.addEventListener("click",()=>{



    const data={


        reportDate:
        document.getElementById("reportDate").value,


        reporter:
        document.getElementById("reporter").value,


        location:
        document.getElementById("location").value,


        equipment:
        document.getElementById("equipment").value,


        description:
        document.getElementById("description").value,


        status:
        document.getElementById("status").value,


        photos:selectedPhotos,


        video:selectedVideo,


    };





    if(editIndex===-1){



        data.id=

        "PUNCH-" +

        String(punchList.length+1)

        .padStart(3,"0");



        data.createTime=

        new Date().toLocaleString();



        punchList.push(data);



    }

    else{


        data.id=punchList[editIndex].id;


        data.createTime=punchList[editIndex].createTime;


        punchList[editIndex]=data;


    }






    saveData();


    renderList();


    updateCount();



    formArea.style.display="none";


    clearForm();



});











// 顯示列表

function renderList(){


    list.innerHTML="";



    if(punchList.length===0){


        list.innerHTML="<p>目前尚無缺失紀錄</p>";

        return;

    }







    punchList.forEach((item,index)=>{


        let photos="";



        item.photos.forEach(p=>{


            photos+=`

            <img src="${p}"

            width="100"

            style="margin:5px;border-radius:10px;">

            `;


        });






        let video="";


        if(item.video){


            video=`

            <video width="300" controls>

            <source src="${item.video}">

            </video>

            `;

        }





        const div=document.createElement("div");


        div.className="punchCard";




        div.innerHTML=`


        <h3>${item.id}</h3>


        <p>📅 ${item.reportDate}</p>


        <p>👤 ${item.reporter}</p>


        <p>📍 ${item.location}</p>


        <p>⚙️ ${item.equipment}</p>


        <p>📝 ${item.description}</p>


        <p>

        ${getStatusIcon(item.status)}

        ${item.status}

        </p>



        ${photos}


        ${video}



        <br>


        <button onclick="editPunch(${index})">

        ✏️ 編輯

        </button>



        <small>

        ${item.createTime}

        </small>


        `;


        list.appendChild(div);



    });



}








// 編輯功能

function editPunch(index){


    editIndex=index;


    const item=punchList[index];


    document.getElementById("reportDate").value=item.reportDate;


    document.getElementById("reporter").value=item.reporter;


    document.getElementById("location").value=item.location;


    document.getElementById("equipment").value=item.equipment;


    document.getElementById("description").value=item.description;


    document.getElementById("status").value=item.status;



    selectedPhotos=item.photos;


    selectedVideo=item.video;



    formArea.style.display="block";


    window.scrollTo(0,0);


}









function saveData(){


    localStorage.setItem(

        "punchList",

        JSON.stringify(punchList)

    );


}









function updateCount(){


    document.getElementById("pendingCount").innerText=

    punchList.filter(x=>x.status==="待改善").length;



    document.getElementById("progressCount").innerText=

    punchList.filter(x=>x.status==="改善中").length;



    document.getElementById("completeCount").innerText=

    punchList.filter(x=>x.status==="已完成").length;


}








function getStatusIcon(status){


    if(status==="待改善")

    return "🔴";


    if(status==="改善中")

    return "🟡";


    if(status==="已完成")

    return "🟢";


    return "";

}








function clearForm(){


    document.getElementById("reporter").value="";

    document.getElementById("location").value="";

    document.getElementById("equipment").value="";

    document.getElementById("description").value="";


    photoInput.value="";

    videoInput.value="";


    preview.innerHTML="";

    videoPreview.innerHTML="";


    selectedPhotos=[];


    selectedVideo="";


    editIndex=-1;


}