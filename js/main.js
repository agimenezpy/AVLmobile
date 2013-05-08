var remoteUrl = "http://www.warrior.com.py/trackapi";
var Application = function() {
    this.map = false;
    this.selected = -1;

    this.initialize = function() {
        $.ajax({url: remoteUrl + '/login',
            dataType:'jsonp',
            success: function(responseData, status, obj) {
                if (responseData.result.status) {
                    app.vehiculosList();
                }
                else {
                    $("#nonce").val(responseData.result.nonce);
                }
            },
            error: function(e) {
                app.showAlert(e,"Conexion al servidor");
            }
        });
    }

    this.showAlert = function(message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    }
    this.vehiculosList = function() {
        var el = $('#vehiculoList');
        el.html("");
        $.mobile.loading('show')
        $.ajax({
            url: remoteUrl + "/vehiculos/",
            dataType: 'jsonp',
            success: function(responseData) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    $.each(responseData.result.content, function(idx, elem) {
                        el.append("<li><a href='#"+elem.equipoId+"' onclick='app.mostrarVehiculo(this)'>"+
                            "<img src='img/"+( elem.velocidad > 0 ? "green" : "red")+".png' class='ui-li-icon'/><h3>"+elem.alias+"</h3>" +
                            "<p>("+ elem.vehiculoId +") " + elem.marca + "/" +  elem.modelo + "</p>" +
                            "<p>"+elem.fechaEvento +"</p>" +
                            "<span class='ui-li-count'>"+ elem.velocidad + "</span>" +
                            "</a></li>");
                    });
                    $(el).listview('refresh');
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener vehiculos");
                }
            }
        });
        $.mobile.changePage("#vehiculos");
    };
    this.logout = function(e) {
        $.ajax({url: remoteUrl + '/logout',
            dataType:'jsonp',
            success: function(responseData, status, obj) {
                if (responseData.result.status) {
                    $("#nonce").val(responseData.result.nonce);
                    $.mobile.changePage("#login");
                }
                else {
                    this.showAlert(responseData.result.message,"Cerrar Sesion");
                }
            }
        });
    }
    this.login = function(e) {
        var $this = this;
        e.preventDefault();
        $.mobile.loading('show')
        $("#password").val(CryptoJS.MD5($("#username").val() + ":" + $("#password").val() + ":" + $("#nonce").val()).toString());
        $.ajax({url: remoteUrl + '/login',
            data: $($this).serialize(),
            dataType:'jsonp',
            success: function(responseData, status, obj) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    app.vehiculosList();
                    $this.reset()
                }
                else {
                    $("#password").val("");
                    $("#nonce").val(responseData.result.nonce);
                    app.showAlert(responseData.result.message,"Iniciar Sesion");
                }
            }
        });
    }
    this.showMap = function() {
        $.mobile.loading('show')
        $.ajax({
            url: remoteUrl + "/vehiculo/" + this.selected + "/",
            dataType: 'jsonp',
            success: function(responseData) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    var posicion = new google.maps.LatLng(responseData.result.content.latitud, responseData.result.content.longitud);
                    $('#map_canvas').gmap('clear','markers');
                    $('#map_canvas').gmap('addMarker', {'position': posicion, 'bounds':true});
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener vehiculo");
                }
            }
        });
    }
    this.mostrarVehiculo = function (e) {
        this.selected = e.href.replace(/.*#/,'')
        $.mobile.changePage("#mapa", {transition: 'pop'});
    }

    this.initialize();
}

var app;

$( document ).bind( "mobileinit", function() {
    $.mobile.allowCrossDomainPages = true;
    app = new Application();
    $('#login-form').live("submit", app.login);
    $('#mapa').live("pageshow", function() {
        if (!app.map) {
            $.mobile.loading('show');
            $('#map_canvas').gmap({'streetViewControl':false, 'mapTypeId':google.maps.MapTypeId.HYBRID});
            navigator.geolocation.getCurrentPosition(function(position) {
                    $('#map_canvas').gmap({'center': position.coords.latitude + ', ' + position.coords.longitude, 'bounds': true});
                    $.mobile.loading('hide');
                },
                function(error){
                    $.mobile.loading('hide');
            })
            app.map = true;
        }
        $('#mapa').css({height:"85%"});
        $('#map_canvas').gmap('refresh');
        app.showMap();
    });
});