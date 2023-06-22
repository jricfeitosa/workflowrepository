const gitlabToken = localStorage.getItem('gitlabToken');
const projectId = localStorage.getItem('projectId');
const fileInput = document.getElementById('fileInput');
const fileSelect = document.getElementById('fileSelect');
const selectedFileNameLabel = document.querySelector('label[for="fileSelect"]');
const selectedFileNameSpan = document.getElementById('selectedFileName');
const fileList = document.getElementById('fileList');
const chooseMainFile = document.getElementById('chooseMainFile');
const continueButton = document.getElementById('continueButton');
const removeButton = document.getElementById('remove');
const fileUploadButton = document.querySelector('#fileUpload button');
const advanceButton = document.getElementById('advance');
let mainFileName;
let mainFile;
let selectedFiles = {};
let changePage = false;
let images = [];
let imageNames = [];
let currentSize = 0;
let changeSavedFile = false;
let fileHandles = [];

async function createZip(selectedFiles, arquivoPrincipal) {
  const jszip = new JSZip();

  const principal = selectedFiles[arquivoPrincipal];
  if (principal) {
    const principalFile = await principal.getFile();
    jszip.file(principal.name, principalFile);
  }

  const pasta = jszip.folder("dependencies");

  for (const fileName in selectedFiles) {
    if (fileName !== arquivoPrincipal) {
      const file = await selectedFiles[fileName].getFile();
      pasta.file(fileName, file);
    }
  }
  
  const content = await jszip.generateAsync({ type: "blob" });

  return content;
}

function CreateTagMessage(list) {
  var textareaContent = document.getElementById('description').value;
  var argumentsString = list.map(function(item) {
    return item.name + "-" + item.direction + "-" + item.type + "-" + item.description;
  }).join('\n');
  
  var outputString = "Descrição:\n" + textareaContent + "\nArgumentos:\n" + argumentsString;

  return outputString;
}

function generateUniqueName(name) {
  let baseName = name;
  let extension = '';
  let counter = 1;

  // Check if the name has an extension and split it
  const dotIndex = name.lastIndexOf('.');
  if (dotIndex >= 0) {
    baseName = name.slice(0, dotIndex);
    extension = name.slice(dotIndex);
  }

  // Check if the name is already in use and generate a new one if necessary
  while (selectedFiles[name]) {
    name = `${baseName}(${counter})${extension}`;
    counter++;
  }

  return name;
}

function displayTotalSize(current_size) {
  if (current_size < 2) {
    document.getElementById('spanTotalSize').style.color = 'green';
  } else if (current_size >= 2 && current_size < 4) {
    document.getElementById('spanTotalSize').style.color = 'yellow';
  } else {
    document.getElementById('spanTotalSize').style.color = 'red';
  }
}

async function fileToBase64(selectedFile) {
  const fileContent = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(selectedFile, 'UTF-8');
  });
  return fileContent;
}

function calcularTamanhoEmBytes(variavel) {
  // Converte a variável em uma string
  let stringVariavel;

  if (typeof variavel === "string") {
    stringVariavel = variavel;
  } else if (typeof variavel === "object" && variavel !== null) {
    stringVariavel = JSON.stringify(variavel);
  } else {
    stringVariavel = String(variavel);
  }

  // Calcula o tamanho em bytes da string
  let tamanhoEmBytes = 0;
  for (let i = 0; i < stringVariavel.length; i++) {
    const charCode = stringVariavel.charCodeAt(i);

    if (charCode <= 0x7f) {
      tamanhoEmBytes += 1;
    } else if (charCode <= 0x7ff) {
      tamanhoEmBytes += 2;
    } else if (charCode >= 0xd800 && charCode <= 0xdbff) {
      // Encontra um caractere UTF-16 surrogate pair
      tamanhoEmBytes += 4;
      i++;
    } else {
      tamanhoEmBytes += 3;
    }
  }
}

function updateFileList() {
  fileList.innerHTML = '';
  for (const fileName of Object.keys(selectedFiles)) {
    const file = selectedFiles[fileName];
    const fileNameElement = document.createElement('p');
    fileNameElement.classList.add('file-name');
    fileNameElement.setAttribute('data-file', fileName);
    fileNameElement.onclick = function () {
      document.getElementById('inicial').style.display = 'none';
      if(!fileNameElement.classList.contains('main-file-selected')) {
        if (changeSavedFile) {
          document.getElementById('save').textContent = 'Save Change';
          document.getElementById('save').disabled = false;
          document.getElementById('save').classList.add('selectSaveFileHover');
          document.getElementById('save').classList.remove('selectedSaveFile');
          changeSavedFile = false;
        } 
      } 
      for (const fileName of Object.keys(selectedFiles)) {
        const file = selectedFiles[fileName];
        if (fileName === fileNameElement.getAttribute('data-file')) {
          mainFile = file;
          calcularTamanhoEmBytes(mainFile);
          mainFileName = fileName;
          markAsMainFile(fileNameElement);
          showDescriptionAndTable();
          showInfos(fileNameElement, selectedFiles[fileName].name);
        } else {
          const currentElement = document.querySelector(`[data-file="${fileName}"]`);
          markOffAsmainFile(currentElement);
        }
      }
      const paragraphs = fileList.querySelectorAll('.file-name'); // Modifique esta linha
      let maxWidth = 0;
      paragraphs.forEach((paragraph) => {
        const paragraphWidth = paragraph.getBoundingClientRect().width;
        maxWidth = Math.max(maxWidth, paragraphWidth);
      });
      paragraphs.forEach((paragraph) => {
        paragraph.style.minWidth = `${maxWidth}px`;
      });
    }
    fileNameElement.textContent = fileName;
    fileList.appendChild(fileNameElement);
    if (fileName === mainFileName) {
      markAsMainFile(fileNameElement);
    } else {
      markOffAsmainFile(fileNameElement);
    }
  }
  const paragraphs = fileList.querySelectorAll('.file-name'); // Modifique esta linha
  let maxWidth = 0;
  paragraphs.forEach((paragraph) => {
    const paragraphWidth = paragraph.getBoundingClientRect().width;
    maxWidth = Math.max(maxWidth, paragraphWidth);
  });
  paragraphs.forEach((paragraph) => {
    paragraph.style.minWidth = `${maxWidth}px`;
  });
}

function markAsMainFile(fileItem) {
  if (!fileItem.classList.contains('main-file-selected')) {
    fileItem.classList.add('main-file-selected');
  }
  if (!fileItem.querySelector('.main-file-label')) {
    const mainFileLabel = document.createElement('span');
    mainFileLabel.textContent = '(Principal)';
    mainFileLabel.classList.add('main-file-label');
    fileItem.appendChild(mainFileLabel);
  }
}

function markOffAsmainFile(fileItem) {
  if (fileItem.classList.contains('main-file-selected')) {
    fileItem.classList.remove('main-file-selected');
  }
  const existingMainFileLabel = fileItem.querySelector('.main-file-label');
  if (existingMainFileLabel) {
    fileItem.removeChild(existingMainFileLabel);
  }
}

function updateSelectedFile(file) {
  if (!selectedFiles.hasOwnProperty(file.name)) {
    selectedFiles[file.name] = file;
  }
}

function showDescriptionAndTable() {
  const infoArea = document.getElementById('infoArea');
  infoArea.classList.add('info-area-highlight');
  showInfoArea();
  const descriptionTextarea = document.getElementById("description");
  const argumentsTable = document.getElementById("argumentsTable");
  descriptionTextarea.style.display = "block";
  argumentsTable.style.display = "table";
}

function getArgumentsXaml(xaml) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xaml, 'application/xml');

  const membersList = xmlDoc.getElementsByTagName('x:Members');

  let propertiesInfo = [];

  if (membersList.length > 0) {
    const membersNode = membersList[0];
    const propertyNodes = Array.from(membersNode.childNodes).filter(member => member.nodeType === Node.ELEMENT_NODE);

    for (const propertyNode of propertyNodes) {
      const annotationText = propertyNode.getAttribute('sap2010:Annotation.AnnotationText');
      const name = propertyNode.getAttribute('Name');
      const type = propertyNode.getAttribute('Type');

      propertiesInfo.push({ annotationText, name, type });
    }
  }

  return propertiesInfo;
}

async function showInfos(selectedFileNameSpan, spanFileName) {
  const selectedFileName = selectedFileNameSpan.textContent.replace('(Principal)', '').trim();
  const selectedFile = selectedFiles[selectedFileName];

  const fileInfo = document.getElementById('infoWorkflow');
  fileInfo.textContent = `${selectedFileName}`;
  
  if (selectedFile) {
    try {
      const file = await selectedFile.getFile();
      const fileContent = await file.text();

      const annotation = getDescriptionXaml('Sequence', 'http://schemas.microsoft.com/netfx/2010/xaml/activities/presentation', 'Annotation.AnnotationText', fileContent, spanFileName);
      
      const descriptionTextarea = document.getElementById("description");
      descriptionTextarea.value = annotation;
      descriptionTextarea.maxLength = 5000;
      descriptionTextarea.addEventListener('keypress', checkCharLimit(descriptionTextarea, 5000));
      descriptionTextarea.addEventListener('input', function(event) {
        document.getElementById('save').textContent = 'Save Changes';
        document.getElementById('save').disabled = false;
        document.getElementById('save').classList.add('selectSaveFileHover');
        document.getElementById('save').classList.remove('selectedSaveFile');
        changeSavedFile = false;
      });
      const args = getArgumentsXaml(fileContent);
      const argumentsList = [];
      for (let argument of args) {
        const reg = /\(\w+:/g;
        argumentsList.push({
          name: argument.name,
          direction: argument.type.split('Argument')[0],
          type: argument.type.split('Argument')[1].replace(reg, "(").slice(1,-1),
          description: argument.annotationText,
        });
      }
      
      displayArgumentsTable(argumentsList);
    } catch (error) {
      console.error('Erro ao ler o arquivo:', error);
      janelaPopUp.abre('Erro', 'Ocorreu um erro ao ler o arquivo. Verifique se você tem permissão para acessá-lo e tente novamente.');
    }
  } else {
    janelaPopUp.abre('Erro', 'Selecione um arquivo .xaml válido.');
  }
}

function getDescriptionXaml(tagName, sapNamespace, attribute, fileContent, selectedFileName) {
  const parser = new DOMParser();
  const xamlDoc = parser.parseFromString(fileContent, "application/xml");

  const fileName = selectedFileName.split('\\').pop().split('.').shift();
  const sequencesAnnotation = xamlDoc.getElementsByTagName(tagName);
  let targetSequence = null;
  for (let i = 0; i < sequencesAnnotation.length; i++) {
    
    if ((sequencesAnnotation[i].getAttribute('DisplayName')) && (sequencesAnnotation[i].getAttribute('DisplayName').trim() === fileName)) {
      targetSequence = sequencesAnnotation[i];
      break;
    }
  }
  if (targetSequence) {
    const annotationText = targetSequence.getAttributeNS(sapNamespace, attribute);
    return annotationText;
  } else {
    return '';
  }
}

function checkInput(event) {
  const currentLength = event.target.value.length;
  if (currentLength >= event.target.maxLength) {
    showWarningTooltip(event.target, `Limite de caracteres atingido`);
  } else if (event.key === '-') {
    event.preventDefault();
    showWarningTooltip(event.target, "Caractere inválido");
  }
}

function showWarningTooltip(element, message) {
  const tooltip = document.createElement("div");
  tooltip.classList.add("warning-tooltip");
  const popupBg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  popupBg.classList.add("popup-bg");
  popupBg.setAttribute("viewBox", "0 0 200 87");
  popupBg.setAttribute("height", "87");
  popupBg.setAttribute("width", "200");
  popupBg.innerHTML = '<path d="M 36.498047 12.695313 C 52.400391 10.296336 69.058594 8.411009 119.478516 8.877963 C 199.148438 9.619253 241.259766 9.140625 264.773438 14.388021 C 283.253906 18.520564 299.103516 26.085219 298.154297 46.502784 L 296.455078 82.890176 C 295.447266 104.568517 284.777344 112.267421 274.523438 113.726652 C 259.640625 115.845456 244.804688 117.246318 220.013672 112.880298 C 232.523438 118.261943 233.501953 129.001886 233.501953 129.001886 C 233.501953 129.001886 231.509766 121.314655 201.28125 114.999102 C 183.351562 109.955999 83.080078 118.688039 37.769531 112.454203 C 16.453125 109.524066 4.066406 104.194953 3.544922 85.435075 L 2.273438 39.71444 C 1.810547 23.137572 14.613281 15.999012 36.503906 12.695313 Z M 36.498047 12.695313 " fill="#da3636" stroke="#da3636" transform="matrix(0.666667,0,0,0.669231,0,0)"/>';
  tooltip.appendChild(popupBg);
  const popupOutline = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  popupOutline.classList.add("popup-outline");
  popupOutline.setAttribute("viewBox", "0 0 200 87");
  popupOutline.setAttribute("height", "87");
  popupOutline.setAttribute("width", "200");
  popupOutline.innerHTML = '<g stroke-width="2" stroke-linecap="round"><path id="popup-outline-left" d="M 233.501953 129.001886 C 233.501953 129.001886 231.509766 121.314655 201.28125 114.999102 C 183.351562 109.955999 83.080078 118.688039 37.769531 112.454203 C 16.453125 109.524066 4.066406 104.194953 3.544922 85.435075 L 2.273438 39.71444 C 1.810547 23.137572 14.613281 15.999012 36.503906 12.695313 C 52.400391 10.296336 69.058594 8.411009 119.478516 8.877963 " fill="none" stroke="#303030" transform="matrix(0.666667,0,0,0.669231,0,0)"/><path id="popup-outline-right" d="M 119.478516 8.877963 C 199.148438 9.619253 241.259766 9.140625 264.773438 14.388021 C 283.253906 18.520564 299.103516 26.085219 298.154297 46.502784 L 296.455078 82.890176 C 295.447266 104.568517 284.777344 112.267421 274.523438 113.726652 C 259.640625 115.845456 244.804688 117.246318 220.013672 112.880298 C 232.523438 118.261943 233.501953 129.001886 233.501953 129.001886 " fill="none" stroke="#303030" transform="matrix(0.666667,0,0,0.669231,0,0)"/>';
  tooltip.appendChild(popupOutline);
  animateOutline(tooltip);
  const msg = document.createElement('span');
  msg.classList.add('tooltip-text');
  msg.textContent = message;
  msg.style.position = 'absolute';
  tooltip.appendChild(msg);
  if (element.parentElement.classList.contains('textarea-container')) {
    tooltip.style.left = '40%';
  }
  if (message === 'Limite de caracteres atingido') {
    msg.style.textAlign = 'justify';
    msg.style.width = '200px';
    msg.style.whiteSpace = 'normal';
    msg.style.left = '15px';
  }
  element.parentElement.appendChild(tooltip);
  setTimeout(() => {
    element.parentElement.removeChild(tooltip);
  }, 3000);
}

function animateOutline(element) {
  const leftOutline = element.querySelector("#popup-outline-left");
  const rightOutline = element.querySelector("#popup-outline-right");
  const leftOutlineLength = leftOutline.getTotalLength();
  const rightOutlineLength = rightOutline.getTotalLength();

  leftOutline.style.strokeDasharray = leftOutlineLength;
  leftOutline.style.strokeDashoffset = leftOutlineLength;
  leftOutline.style.transition = "stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1)";

  rightOutline.style.strokeDasharray = rightOutlineLength;
  rightOutline.style.strokeDashoffset = rightOutlineLength;
  rightOutline.style.transition = "stroke-dashoffset 500ms cubic-bezier(0.4, 0, 0.2, 1)";

  setTimeout(() => {
    leftOutline.style.strokeDashoffset = 0;
    rightOutline.style.strokeDashoffset = 0;
  }, 100);
}

function checkCharLimit(textarea, maxLength) {
  const currentLength = textarea.value.length;
  if (currentLength >= maxLength) {
    showWarningTooltip(textarea, `Limite de caracteres atingido`);
  }
}

function displayArgumentsTable(args) {
  const tableBody = document.getElementById("argumentsTableBody");
  tableBody.innerHTML = "";

  for (const argument of args) {
    const row = document.createElement("tr");

    const createCellWithInput = (value, type) => {
      const cell = document.createElement("td");
      if (type === 'description') {
        const textarea = document.createElement("textarea");
        textarea.className = 'description-input';
        textarea.textContent = value;
        textarea.maxLength = 500;
        textarea.style.resize = `none`;
        textarea.addEventListener('keypress', checkInput); // Adiciona o manipulador de eventos "keypress" ao elemento de entrada
        textarea.addEventListener('input', function(event) {
          document.getElementById('save').textContent = 'Save Changes';
          document.getElementById('save').disabled = false;
          document.getElementById('save').classList.add('selectSaveFileHover');
          document.getElementById('save').classList.remove('selectedSaveFile');
          changeSavedFile = false;
        });
        cell.appendChild(textarea);
      } else {
        const input = document.createElement("input");
        input.classList.add('disabledInput');
        input.value = value;
        input.maxLength = 200;
        input.readOnly = true;
        input.disabled = true;
        input.addEventListener('keypress', checkInput); // Adiciona o manipulador de eventos "keypress" ao elemento de entrada
        cell.appendChild(input);
              
      }
      return cell;
    };
    
    row.appendChild(createCellWithInput(argument.name, 'name'));
    row.appendChild(createCellWithInput(argument.direction, 'direction'));
    row.appendChild(createCellWithInput(argument.type, 'type'));
    row.appendChild(createCellWithInput(argument.description, 'description'));

    
    tableBody.appendChild(row);
  }
}

function showInfoArea() {
  const infoArea = document.getElementById('infoArea');
  infoArea.style.display = 'block';
}

function updateAnnotationText(xaml, displayName, newText) {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const xmlDoc = parser.parseFromString(xaml, 'application/xml');

  const sequences = xmlDoc.getElementsByTagName('Sequence');

  for (let i = 0; i < sequences.length; i++) {
    const sequence = sequences[i];
    if (sequence.getAttribute('DisplayName') === displayName) {
      sequence.setAttribute('sap2010:Annotation.AnnotationText', newText);
      break;
    }
  }

  return serializer.serializeToString(xmlDoc).replace(/ xmlns=""/g, '');
}

function updateArgumentText(xaml, newText, argumentName) {
  const parser = new DOMParser();
  const serializer = new XMLSerializer();
  const xmlDoc = parser.parseFromString(xaml, 'application/xml');

  const xMembers = xmlDoc.getElementsByTagName('x:Members')[0];
  if (xMembers) {
    const xProperties = xMembers.getElementsByTagName('x:Property');

    for (let i = 0; i < xProperties.length; i++) {
      const xProperty = xProperties[i];
      if (xProperty.getAttribute('Name') === argumentName) {
        xProperty.setAttribute('sap2010:Annotation.AnnotationText', newText);
        break;
      }
    }
  }

  return serializer.serializeToString(xmlDoc).replace(/ xmlns=""/g, '');
}

function saveModifiedXaml(modifiedXaml, xamlName) {
  const blob = new Blob([modifiedXaml], { type: 'application/xaml+xml' });
  saveAs(blob, xamlName);
}

function updateFileContent(files, name, newContent) {
  const fileIndex = files.findIndex(file => file.name === name);

  if (fileIndex === -1) {
    console.error(`File with name "${name}" not found.`);
    return files;
  }

  const newFile = new File([newContent], name, { type: 'application/xaml+xml' });
  const updatedFiles = [...files];
  updatedFiles[fileIndex] = newFile;

  return updatedFiles;
}

function getTableContent() {
  const table = document.getElementById('argumentsTableBody');
  const rows = table.querySelectorAll('tr');
  const data = [];

  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].getElementsByTagName('td');
    const rowData = {
      name: cells[0].querySelector('input').value,
      direction: cells[1].querySelector('input').value,
      type: cells[2].querySelector('input').value,
      description: cells[3].querySelector('textarea').value.replace(/(\r\n|\n|\r)/gm, "")
    };
    data.push(rowData);
  }
  return data;
}

function saveModifiedXaml(modifiedXaml, fileName) {
  const blob = new Blob([modifiedXaml], { type: 'application/xml' });
  saveAs(blob, fileName);
}

function addFileName(fileName) {
  const baseName = fileName.slice(0, fileName.lastIndexOf('.'));
  const extension = fileName.slice(fileName.lastIndexOf('.'));
  let newFileName = fileName;
  let counter = 1;

  while (imageNames.includes(newFileName)) {
      newFileName = `${baseName}(${counter})${extension}`;
      counter++;
  }

  imageNames.push(newFileName);
  return newFileName;
}

// Função para verificar o tamanho atual do localStorage
function checkLocalStorageSize() {
  let total = 0;
  const defaultKeys = ["length", "clear", "getItem", "setItem", "removeItem", "key"];

  for(let x in localStorage) {
    // Ignora as chaves padrão do localStorage
    if(defaultKeys.includes(x)) {
      continue;
    }

    let amount = (localStorage[x].length * 2) / 1024 / 1024; // transforma para MB
    total += amount;
  }
  return total;
}

// Função para verificar o tamanho total dos arquivos selecionados
async function checkFilesSize(files) {
  let total = 0;
  for (let file of files) {
    const fileData = await file.getFile();
    total += fileData.size / 1024 / 1024; // transforma para MB
  }
  return total;
}

function displayImage(url) {
  // Crie o fundo escuro
  const background = document.createElement('div');
  background.classList.add('background');

  // Crie o elemento de imagem para exibir a imagem em tamanho maior
  const img = document.createElement('img');
  img.src = url;
  img.classList.add('displayImage');

  // Crie o botão para fechar a imagem
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.classList.add('closeButton');

  // Função para remover o fundo, a imagem e o botão de fechar
  const removeElements = () => {
    document.body.removeChild(background);
    document.body.removeChild(img);
    document.body.removeChild(closeButton);
  };
  // Adicione ouvintes de evento de clique ao fundo e ao botão de fechar
  background.addEventListener('click', removeElements);
  closeButton.addEventListener('click', removeElements);

  // Adicione o fundo, a imagem e o botão de fechar ao body
  document.body.appendChild(background);
  document.body.appendChild(img);
  document.body.appendChild(closeButton);
  window.scrollTo(0, 0);
}

async function createOrUpdateCommit(projectId, filePath, branchName, privateToken, commitMessage, fileContent) {
  let encoding = 'base64';

  let url = `https://gitlab.com/api/v4/projects/${projectId}/repository/commits`;

  let updateData = {
      branch: branchName,
      commit_message: commitMessage,
      actions: [
          {
              action: "update",
              file_path: filePath,
              content: fileContent,
              encoding: encoding
          }
      ]
  };

  let createData = {
      branch: branchName,
      commit_message: commitMessage,
      actions: [
          {
              action: "create",
              file_path: filePath,
              content: fileContent,
              encoding: encoding
          }
      ]
  };

  try {
      const updateResponse = await fetch(url, {
          method: 'POST',
          headers: {
              'PRIVATE-TOKEN': privateToken,
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
      });
      if (!updateResponse.ok) {
          const createResponse = await fetch(url, {
              method: 'POST',
              headers: {
                  'PRIVATE-TOKEN': privateToken,
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify(createData)
          });
          if (!createResponse.ok) {
              throw new Error(`Failed to create file: ${createResponse.statusText}`);
          }
          
          const createdData = await createResponse.json();
          return createdData.id;
      }
      
      const updatedData = await updateResponse.json();
      return updatedData.id;
  } catch (error) {
      console.error('Error:', error);
  }
}

function removeAllImgItems() {
  let hasImgKey = false;
  
  for (let i = localStorage.length - 1; i >= 0; i--){
    let key = localStorage.key(i);
    if(key.startsWith('img')) {
        localStorage.removeItem(key);
        hasImgKey = true;
    }
  }

  if (hasImgKey) {
    removeAllImgItems();
  }
}

var janelaPopUpSucess = new Object();
janelaPopUpSucess.abre = function(titulo, textoEnviar){
  id = "errorPopup";
  var popFundo = '<div id="popFundo_errorPopup" class="popUpFundo green green green green "></div>'
  var janela = '<div id="errorPopup" class="popUp p green   "><h1>'+titulo+'</h1><div><span>'+textoEnviar+'</span></div><button class="puCancelar alert " id="errorPopup_cancelar" data-parent=errorPopup>OK</button></div>';
  $("body").append(popFundo);
  $("body").append(janela);
  $("body").append(popFundo);
  $("#popFundo_" + id).fadeIn("fast");
  $("#" + id).addClass("popUpEntrada");
  $("#" + id + '_cancelar').on("click", function(){
    janelaPopUpSucess.fecha(id);
  });
};

janelaPopUpSucess.fecha = function(id){
    if(id !== undefined){
      $("#" + id).removeClass("popUpEntrada").addClass("popUpSaida"); 
      $("#popFundo_" + id).fadeOut(1000, function(){
          $("#popFundo_" + id).remove();
          $("#" + $(this).attr("id") + ", #" + id).remove();
          if (!($(".popUp")[0])){
              $("window, body").css('overflow', 'auto');
          }
      });
    }
    else{
      $(".popUp").removeClass("popUpEntrada").addClass("popUpSaida"); 
      $(".popUpFundo").fadeOut(1000, function(){
          $(".popUpFundo").remove();
          $(".popUp").remove();
          $("window, body").css('overflow', 'auto');
      });
    }
}

var janelaPopUp = new Object();
janelaPopUp.abre = function(titulo, textoEnviar){
  id = "errorPopup";
  var popFundo = '<div id="popFundo_errorPopup" class="popUpFundo red red red red "></div>'
  var janela = '<div id="errorPopup" class="popUp p red   "><h1>'+titulo+'</h1><div><span>'+textoEnviar+'</span></div><button class="puCancelar alert " id="errorPopup_cancelar" data-parent=errorPopup>OK</button></div>';
  $("body").append(popFundo);
  $("body").append(janela);
  $("body").append(popFundo);
  $("#popFundo_" + id).fadeIn("fast");
  $("#" + id).addClass("popUpEntrada");
  $("#" + id + '_cancelar').on("click", function(){
    janelaPopUp.fecha(id);
  });
};

janelaPopUp.fecha = function(id){
    if(id !== undefined){
      $("#" + id).removeClass("popUpEntrada").addClass("popUpSaida"); 
      $("#popFundo_" + id).fadeOut(1000, function(){
          $("#popFundo_" + id).remove();
          $("#" + $(this).attr("id") + ", #" + id).remove();
          if (!($(".popUp")[0])){
              $("window, body").css('overflow', 'auto');
          }
      });
    }
    else{
      $(".popUp").removeClass("popUpEntrada").addClass("popUpSaida"); 
      $(".popUpFundo").fadeOut(1000, function(){
          $(".popUpFundo").remove();
          $(".popUp").remove();
          $("window, body").css('overflow', 'auto');
      });
    }
}

function removeItemsFromLocalStorage(keysToKeep) {
  for (let i = 0; i < localStorage.length; i++){
    let key = localStorage.key(i);
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
    }
  }
}

function localStorageContainsImg(keysToKeep) {
  for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (!keysToKeep.includes(key)) {
          return true;
      }
  }
  return false;
}

document.addEventListener('DOMContentLoaded', (event) => {
  // Lista das chaves que você quer manter
  let keysToKeep = ["authenticated", "gitlabToken", "projectId"];

  while (localStorageContainsImg(keysToKeep)) {
    removeItemsFromLocalStorage(keysToKeep);
  }
});

document.getElementById('saveImages').addEventListener('click', async function(event) {
  removeAllImgItems();
  for (let i = 0; i <= images.length - 1; i++) {
    const imgFileHandle = await images[i].getFile();
    const imgBase64 = await fileToBase64(imgFileHandle);
    localStorage.setItem(`img${imageNames[i]}`, imgBase64.split(';base64,').pop());
    event.target.textContent = 'Saved';
    event.target.disabled = true;
    event.target.classList.remove('selectSaveImageHover');
    document.getElementById('saveImages').classList.add('selectedSaveImage');
  }
  janelaPopUpSucess.abre('Sucesso', 'Imagens salvas com sucesso!');
});

document.getElementById('save').addEventListener('click', async function(event) {
  const mainFileHandle = selectedFiles[mainFileName];
  const file = await mainFileHandle.getFile();
  let fileContent = await file.text();

  fileContent = updateAnnotationText(fileContent, mainFileName.replace('.xaml', '').replace(/(\(\d+\))/, ''), document.getElementById('description').value);

  const data = getTableContent();

  for (rowData of data) {
    fileContent = updateArgumentText(fileContent, rowData.description, rowData.name);
  }

  const writable = await mainFileHandle.createWritable();
  await writable.write(fileContent);
  await writable.close();
  
  window.mainFileSelected = mainFile;
  event.target.textContent = 'Saved';
  event.target.disabled = true;
  event.target.classList.remove('selectSaveFileHover');
  document.getElementById('save').classList.add('selectedSaveFile');
  changeSavedFile = true;
  janelaPopUpSucess.abre('Sucesso', 'Alterações salvas com sucesso!');
});

document.getElementById('uploadImage').addEventListener('click', async () => {
  // Div para exibir as imagens
  const viewImageDiv = document.querySelector('.viewImage');
  if (currentSize > 5) {
    janelaPopUp.abre('Erro', 'The total size of the selected files exceeds 5MB.');
    return;
  }
  // Use a API FileSystem Access para ler os arquivos
  const currentImages = await window.showOpenFilePicker({ multiple: true });

  // Verifica o tamanho do localStorage e dos arquivos selecionados
  
  const filesSize = await checkFilesSize(currentImages);
  const totalSize = currentSize + filesSize;
  if (totalSize > 5) {
    janelaPopUp.abre('Erro', 'The total size of the selected files exceeds 5MB.');
    return;
  }
  currentSize += filesSize;
  document.getElementById('spanTotalSize').textContent = currentSize.toFixed(2);
  displayTotalSize(currentSize);
  if (currentImages.length > 0) {
    imageNames = [];
    document.getElementById('saveImages').classList.add('selectSaveImageHover');
    document.getElementById('saveImages').classList.remove('selectedSaveImage');
    document.getElementById('saveImages').textContent = 'Save Images';
    document.getElementById('saveImages').disabled = false;
  }

  images.push(...currentImages);

  document.querySelector('.viewImage').innerHTML = '';

  for (let i = 0; i <= images.length - 1; i++) {
    const currentFileName = addFileName(images[i].name);

    const file = await images[i].getFile();

    // Crie um novo objeto URL para o arquivo
    const objectUrl = URL.createObjectURL(file);

    const imgDiv = document.createElement('div');
    imgDiv.classList.add('imgDiv');
    imgDiv.id = `imgDiv-${i}`;

    //testar
    const imgTooltip = document.createElement('div');
    imgTooltip.id = `imgTooltipDiv-${i}`;
    imgTooltip.style.position = 'relative';
    // Crie a miniatura da imagem
    const img = document.createElement('img');
    img.src = objectUrl;
    img.classList.add('thumbnail', 'zoomable');
    // Adicione ouvintes de evento para exibir a imagem ampliada
    img.addEventListener('mouseover', function(event) {
      const zoomedImage = document.createElement('img');
      zoomedImage.src = this.src;
      zoomedImage.classList.add('zoomed');
      const divTooltip = event.target.previousElementSibling;
      divTooltip.appendChild(zoomedImage);
      zoomedImage.style.display = 'block';
    });

    img.addEventListener('mouseout', function(event) {
      const divTooltip = event.target.previousElementSibling;
      const zoomedImage =divTooltip.querySelector('.zoomed');
      divTooltip.removeChild(zoomedImage);
    });
    img.addEventListener('click', () => displayImage(objectUrl));

    const labelImg = document.createElement('p');
    labelImg.textContent = currentFileName;
    labelImg.classList.add('labelImg');

    // Crie o botão para deletar a imagem
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('btn-delete-img');
    deleteButton.id = `delimgDiv-${i}`;
    deleteButton.setAttribute('imgName', currentFileName);
    deleteButton.addEventListener('click', async (event) => {
      document.getElementById('saveImages').classList.add('selectSaveImageHover');
      document.getElementById('saveImages').classList.remove('selectedSaveImage');
      document.getElementById('saveImages').textContent = 'Save Images';
      document.getElementById('saveImages').disabled = false;
      URL.revokeObjectURL(objectUrl);
      viewImageDiv.removeChild(imgDiv);
      const imgName = event.target.getAttribute('imgName');
      const filesSize = await checkFilesSize([images[imageNames.indexOf(imgName)]]);
      currentSize -= filesSize;
      document.getElementById('spanTotalSize').textContent = currentSize.toFixed(2);
      displayTotalSize(currentSize);
      const currentIdBtnImg = event.target.id.match(/(\d+)/) ? event.target.id.match(/(\d+)/)[0] : null;
      if(localStorage.getItem(`img${imgName}`) !== null) {
          localStorage.removeItem(`img${imgName}`);
      }
      imageNames.splice(Number(currentIdBtnImg), 1);
      images.splice(Number(currentIdBtnImg), 1);
      document.querySelectorAll('.imgDiv').forEach((div, index) => {
        const newId = index;
        div.id = `imgDiv-${newId}`;
        const btn = div.querySelector('.btn-delete-img');
        btn.id = `delimgDiv-${newId}`;
        btn.setAttribute('imgName', imageNames[index]);
      });
      if (document.querySelectorAll('.imgDiv').length === 0) {
        document.getElementById('saveImages').style.display = 'none';
      }
    });
    imgDiv.appendChild(imgTooltip);
    imgDiv.appendChild(img);
    imgDiv.appendChild(labelImg);
    imgDiv.appendChild(deleteButton);
    
    viewImageDiv.appendChild(imgDiv);
    document.getElementById('saveImages').style.display = 'block';
  }
});

fileUploadButton.addEventListener('click', async function () {
  const options = {
    multiple: true,
  };
  fileHandles = await window.showOpenFilePicker(options);
  const totalSize = await checkFilesSize(fileHandles);
  if (totalSize + currentSize > 5) {
    janelaPopUp.abre('Erro', 'The total size of the selected files exceeds 5MB.');
  } else {
    currentSize += totalSize;
    document.getElementById('spanTotalSize').textContent = currentSize.toFixed(2);
    displayTotalSize(currentSize);
    for (const fileHandle of fileHandles) {
      const uniqueName = generateUniqueName(fileHandle.name);
      selectedFiles[uniqueName] = fileHandle;
    }
    updateFileList();
    if(!fileList.hasChildNodes()) {
      console.log('nao');
      fileList.classList.remove('addBorderFileList');
    } else {
      console.log('sim');
      fileList.classList.add('addBorderFileList');
    }
  }
});

removeButton.addEventListener('click', async function() {
  const infoArea = document.getElementById('infoArea');
  const currentElement = document.querySelector(`[data-file="${mainFileName}"]`);
  currentElement.remove();
  const totalSize = await checkFilesSize([selectedFiles[mainFileName]]);
  currentSize -= totalSize;
  document.getElementById('spanTotalSize').textContent = currentSize.toFixed(2);
  displayTotalSize(currentSize);
  delete selectedFiles[mainFileName];
  mainFile = "";
  window.mainFileSelected = mainFile;
  mainFileName = "";
  updateFileList();
  if(!fileList.hasChildNodes()) {
    console.log('nao');
    fileList.classList.remove('addBorderFileList');
  } else {
    console.log('sim');
    fileList.classList.add('addBorderFileList');
  }
  infoArea.style.display = 'none';
  document.getElementById('inicial').style.display = 'block';
  document.getElementById('save').textContent = 'Saved';
  document.getElementById('save').disabled = true;
  document.getElementById('save').classList.remove('selectSaveFileHover');
  document.getElementById('save').classList.add('selectedSaveFile');
  changeSavedFile = true;
});

advanceButton.addEventListener('click', async function(event) {
  changePage = true;
  let base64;
  const data = getTableContent();
  const outputString = CreateTagMessage(data);
  localStorage.setItem('tagMessage', outputString);
  if (Object.keys(selectedFiles).length > 1) {
    console.log('mais');
    const file = await createZip(selectedFiles, mainFileName);
    mainFileName = mainFileName.replace(/\.[^/.]+$/, "") + ".zip";
    localStorage.setItem('mainFileName', mainFileName);
    base64 = await fileToBase64(file);
    localStorage.setItem('file', base64);
  } else {
    console.log('menos');
    localStorage.setItem('mainFileName', mainFileName);
    const tempFile = await selectedFiles[mainFileName].getFile();
    base64 = await fileToBase64(tempFile);
    localStorage.setItem('file', base64);
  }
  window.location.href = '../html/EncontrarCaminhoWorkflow.html';
});