document.getElementById('authenticate').addEventListener('click', authenticate);

async function authenticate() {
    const token = document.getElementById('token').value;
    if (!token) {
        janelaPopUp.abre('Erro', 'Token de acesso não fornecido!');
    } else {
        document.getElementById('authenticate').style.display = 'none';
        document.querySelector('.loadingio-spinner-1').style.display = 'inline-block';
        try {
            const response = await fetch('https://gitlab.com/api/v4/user', {
                headers: {
                    'PRIVATE-TOKEN': token
                }
            });
    
            if (response.ok) {
                const userData = await response.json();
                localStorage.setItem('authenticated', 'true');
                buttonActionComplete();
                localStorage.setItem('gitlabToken', token); // Salvar o token no armazenamento local para uso posterior
                window.location.href = './pages/EncontrarProjeto.html';
            } else {
                buttonActionComplete();
                janelaPopUp.abre('Erro', 'Token de acesso inválido!');
            }
        } catch (error) {
            buttonActionComplete();
            console.error('Erro ao autenticar:', error);
        }
    }
}

function buttonActionComplete() {
    document.querySelector('.loadingio-spinner-1').style.display = 'none';
    document.getElementById('authenticate').style.display = 'inline-block';
    const button = document.getElementById('authenticate');
    button.innerHTML = 'Authenticate';
}

document.addEventListener('DOMContentLoaded', function() {

    const authenticated = localStorage.getItem('authenticated');
    if (authenticated) {
      localStorage.clear();
    }

    while (localStorageContainsImg()) {
        removeImgItemsFromLocalStorage();
    }

  });


  function removeImgItemsFromLocalStorage() {
    for (let i = 0; i < localStorage.length; i++){
      let key = localStorage.key(i);
      if (key.startsWith('img')) {
        localStorage.removeItem(key);
      }
    }
  }
  
  function localStorageContainsImg() {
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key.startsWith('img')) {
            return true;
        }
    }
    return false;
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