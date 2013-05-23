var remoteUrl = "http://www.warrior.com.py/trackapi";
var delay = 15000;
var Application = function() {
    this.map = false;
    this.selected = -1;
    this.markers = [];
    this.int = null;
    this.zoomTo = false;

    this.initialize = function() {
        var self = this;
        $('#login-form').live("submit", this.login);
        $('#home').live("pageshow", self.home);
        $('#vehiculos').live("pageshow", self.vehiculosList);
        $('#detalles').live("pageshow", self.trackList);
        $('#mapa').live("pageshow", self.mostrarFlota);
        this.cargarMapa();
        $.ajax({url: remoteUrl + '/login',
            dataType:'jsonp',
            success: function(responseData, status, obj) {
                if (responseData.result.status) {
                    $.mobile.changePage("#home", {transition: 'slide'});
                }
                else {
                    $("#nonce").val(responseData.result.nonce);
                }
            },
            error: function(e) {
                app.showAlert("Error al contectarse al servidor","Conexion al servidor");
                $.mobile.loading('hide');
            }
        });
    }
    this.cargarMapa = function() {
        var self = this;
        if (!self.map) {
            self.map = new google.maps.Map($('#map_canvas')[0],
                {streetViewControl:false, mapTypeId:google.maps.MapTypeId.HYBRID,
                    zoom: 10,
                    center: new google.maps.LatLng(-25.3, -57.6)})
            /*navigator.geolocation.getCurrentPosition(function(position) {
                    var posicion = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                    self.map.panTo(posicion);
                    var bounds = new google.maps.LatLngBounds()
                    bounds.extend(posicion);
                    self.map.fitBounds(bounds);
                },
                function(error){})*/
        }
    }
    this.showAlert = function(message, title) {
        if (navigator.notification) {
            navigator.notification.alert(message, null, title, 'OK');
        } else {
            alert(title ? (title + ": " + message) : message);
        }
    }
    this.showConfirm = function(message, func) {
        if (navigator.notification.confirm) {
            navigator.notification.confirm(message, func,"Confirmacion","SI,NO");
        }
        else {
            var result = confirm(message)
            func(result ? 1 : 2);
        }
    }
    this.home = function() {
        clearInterval(app.int);
        app.int = null;
        app.selected = -1;
        this.zoomTo = false;
    }
    this.vehiculosList = function() {
        clearInterval(app.int);
        app.int = null;
        var el = $('#vehiculoList');
        el.html("");
        $.mobile.loading('show')
        app.selected = -1;
        this.zoomTo = false;
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
                            "<p>"+elem.fechaRegistro +"</p>" +
                            "<span class='ui-li-count'>"+ elem.velocidad + " KM/H</span>" +
                            "</a></li>");
                    });
                    $(el).listview('refresh');
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener vehiculos");
                }
            }
        });
    };
    this.trackList = function() {
        if (app.selected == -1)
            return;
        var el = $('#trackList');
        el.html("");
        $.mobile.loading('show')
        $.ajax({
            url: remoteUrl + "/track/" + app.selected + "/",
            dataType: 'jsonp',
            success: function(responseData) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    $.each(responseData.result.content, function(idx, elem) {
                        el.append("<li>"+
                            "<img src='img/"+( elem.velocidad > 0 ? "green" : "red")+".png' class='ui-li-icon'/><h3>"+elem.fechaRegistro+"</h3>" +
                            "<p>" + elem.direccion+ "</p>" +
                            "<p>" + elem.descEvento  +"</p>" +
                            "<span class='ui-li-count'>"+ elem.velocidad + " KM/H</span>" +
                            "</li>");
                    });
                    $(el).listview('refresh');
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener recorrido");
                }
            }
        });
    };
    this.logout = function(e) {
        var res = false;
        this.showConfirm("Desea salir?", function(btn) {
            alert(res);
            res = btn == 1;
            alert("Boton " + btn + " Res " + res);
        })
        alert("Salir Res " + res);
        if (!res) {
            return;
        }
        var self = this;
        clearInterval(app.int);
        app.int = null;
        $.ajax({url: remoteUrl + '/logout',
            dataType:'jsonp',
            success: function(responseData, status, obj) {
                if (responseData.result.status) {
                    $("#nonce").val(responseData.result.nonce);
                    $.mobile.changePage("#login");
                }
                else {
                    self.showAlert(responseData.result.message,"Cerrar Sesion");
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
                    $.mobile.changePage("#home", {transition: 'slide'});
                    $this.reset()
                }
                else {
                    $("#password").val("");
                    $("#nonce").val(responseData.result.nonce);
                    app.showAlert(responseData.result.message,"Iniciar Sesion");
                }
            },
            error: function(e) {
                app.showAlert("Error al contectarse al servidor","Conexion al servidor");
                $("#password").val("");
                $.mobile.loading('hide');
            }
        });
    }
    this.mostrarVehiculo = function (e) {
        if (this.selected == -1) {
            this.selected = e.href.replace(/.*#/,'')
            $.mobile.changePage("#mapa", {transition: 'slide'});
        }
        $.mobile.loading('show')
        var self = this;
        if (self.int == null) {
            self.int = setInterval(function() {
                self.mostrarVehiculo();
            }, delay);
        }
        $.ajax({
            url: remoteUrl + "/vehiculo/" + self.selected + "/",
            dataType: 'jsonp',
            success: function(responseData) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    var posicion = new google.maps.LatLng(responseData.result.content.latitud, responseData.result.content.longitud);
                    $.each(self.markers, function(i,o) {
                        o.setMap(null);
                    });
                    self.markers = [];
                    self.markers.push(new google.maps.Marker({
                        position: posicion,
                        map: self.map,
                        icon: "img/marker_" + (responseData.result.content.velocidad > 0 ? "green" : "red") + ".png"
                    }));
                    self.map.panTo(posicion);
                    if (responseData.result.content.velocidad == 0 || self.zoomTo == false) {
                        var bounds = new google.maps.LatLngBounds();
                        bounds.extend(posicion);
                        self.map.fitBounds(bounds);
                        self.zoomTo = true;
                    }
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener vehiculo");
                }
            }
        });
    }
    this.mostrarFlota = function (e) {
        $('#mapa').css({height:"85%"});
        google.maps.event.trigger(app.map, 'resize');
        if (app.selected != -1) {
            return;
        }
        var el = $('#trackList');
        el.html("");
        $.mobile.loading('show')
        var self = app;
        if (self.int == null) {
            self.int = setInterval(function() {
                self.mostrarFlota();
            }, delay);
        }
        $.ajax({
            url: remoteUrl + "/tracks/",
            dataType: 'jsonp',
            success: function(responseData) {
                $.mobile.loading('hide')
                if (responseData.result.status) {
                    $.each(self.markers, function(i,o) {
                        o.setMap(null);
                    });
                    self.markers = [];
                    var bounds = new google.maps.LatLngBounds()
                    $.each(responseData.result.content, function(idx, elem) {
                        el.append("<li>"+
                            "<img src='img/"+( elem.velocidad > 0 ? "green" : "red")+".png' class='ui-li-icon'/><h3>Patente "+elem.vehiculoId+"</h3>" +
                            "<p>" + elem.direccion+ "</p>" +
                            "<p>" + elem.descEvento  +"</p>" +
                            "<p>" + elem.fechaRegistro  +"</p>" +
                            "<span class='ui-li-count'>"+ elem.velocidad + " KM/H</span>" +
                            "</li>");
                        var posicion = new google.maps.LatLng(elem.latitud, elem.longitud);
                        self.markers.push(new google.maps.Marker({
                            position: posicion,
                            map: self.map,
                            icon: "img/marker_" + (elem.velocidad > 0 ? "green" : "red") + ".png"
                        }));
                        bounds.extend(posicion);
                    });
                    self.map.fitBounds(bounds);
                    try {
                        $(el).listview('refresh');
                    }catch(e){

                    }
                }
                else {
                    app.showAlert(responseData.result.message,"Obtener vehiculos");
                }
            }
        });
    }
    this.initialize();
}

var app;
var dd = $.Deferred();
var jqd = $.Deferred();

$.when(dd,jqd).done(function () {
    $.mobile.allowCrossDomainPages = true;
    $.mobile.listview.prototype.options.filterPlaceholder = "Buscar vehiculo ...";
    app = new Application();
})

document.addEventListener('deviceready', deviceReady, false);

function deviceReady() {
    dd.resolve();
    document.addEventListener('backbutton', function() {
        if ($.mobile.activePage.attr('id') == "login") {
            app.showAlert("Salir " + $.mobile.activePage.attr('id'));
            navigator.app.exitApp();
        }
        else if ($.mobile.activePage.attr('id') == "home") {
            app.showAlert("Lista " + $.mobile.activePage.attr('id'));
            app.logout();
        }
        else {
            console.log("Atras " + app.showAlert($.mobile.activePage.attr('id')));
            navigator.app.backHistory();
        }
        return false;
    }, false);
}

$( document ).bind( "mobileinit", function() {
    $.mobile.loader.prototype.options.text = "cargando";
    $.mobile.loader.prototype.options.textVisible = true;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = "";
    jqd.resolve();
});