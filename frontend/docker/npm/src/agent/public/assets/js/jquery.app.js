/**
 * Theme: Minton Admin Template
 * Author: Coderthemes
 * Module/App: Main Js
 */


!function ($) {
    "use strict";

    var Sidemenu = function () {
        this.$body = $("body"),
            this.$openLeftBtn = $(".open-left"),
            this.$menuItem = $("#sidebar-menu a")
    };
    Sidemenu.prototype.openLeftBar = function () {
        $("#wrapper").toggleClass("enlarged");
        $("#wrapper").addClass("forced");

        if ($("#wrapper").hasClass("enlarged") && $("body").hasClass("fixed-left")) {
            $("body").removeClass("fixed-left").addClass("fixed-left-void");
        } else if (!$("#wrapper").hasClass("enlarged") && $("body").hasClass("fixed-left-void")) {
            $("body").removeClass("fixed-left-void").addClass("fixed-left");
        }

        if ($("#wrapper").hasClass("enlarged")) {
            $(".left ul").removeAttr("style");
        } else {
            $(".subdrop").siblings("ul:first").show();
        }

        toggle_slimscroll(".slimscrollleft");
        $("body").trigger("resize");
    },
        //menu item click
        Sidemenu.prototype.menuItemClick = function (element) {

            if (!$("#wrapper").hasClass("enlarged")) {

                if ($(element).parent().hasClass("has_sub")) {

                }
                if (!$(element).hasClass("subdrop")) {
                    // hide any open menus and remove all other classes
                    $("ul", $(element).parents("ul:first")).slideUp(350);
                    $("a", $(element).parents("ul:first")).removeClass("subdrop");
                    $("#sidebar-menu .pull-right i").removeClass("md-remove").addClass("md-add");

                    // open our new menu and add the open class
                    $(element).next("ul").slideDown(350);
                    $(element).addClass("subdrop");
                    $(".pull-right i", $(element).parents(".has_sub:last")).removeClass("md-add").addClass("md-remove");
                    $(".pull-right i", $(element).siblings("ul")).removeClass("md-remove").addClass("md-add");
                } else if ($(element).hasClass("subdrop")) {
                    $(element).removeClass("subdrop");
                    $(element).next("ul").slideUp(350);
                    $(".pull-right i", $(element).parent()).removeClass("md-remove").addClass("md-add");
                }
            }
        },

        //init sidemenu
        Sidemenu.prototype.init = function () {
            var $this = this;

            var ua = navigator.userAgent,
                event = (ua.match(/iP/i)) ? "touchstart" : "click";

            //bind on click
            // this.$openLeftBtn.on(event, function (e) {
            //   e.stopPropagation();
            //   $this.openLeftBar();
            // });

            $('#app').on('click', '.open-left', function (e) {
                e.stopPropagation();
                $this.openLeftBar();
            });

            // LEFT SIDE MAIN NAVIGATION
            // $this.$menuItem.on(event, $this.menuItemClick);

            $('#app').on(event, '#sidebar-menu a', function () {
                $this.menuItemClick($(this));
            });

            // NAVIGATION HIGHLIGHT & OPEN PARENT
            $("#sidebar-menu ul li.has_sub a.active").parents("li:last").children("a:first").addClass("active").trigger("click");
        },

        //init Sidemenu
        $.Sidemenu = new Sidemenu, $.Sidemenu.Constructor = Sidemenu

}(window.jQuery),


    function ($) {
        "use strict";

        var FullScreen = function () {
            this.$body = $("body"),
                this.$fullscreenBtn = $("#btn-fullscreen")
        };

        //turn on full screen
        // Thanks to http://davidwalsh.name/fullscreen
        FullScreen.prototype.launchFullscreen = function (element) {
            if (element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen) {
                element.mozRequestFullScreen();
            } else if (element.webkitRequestFullscreen) {
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {
                element.msRequestFullscreen();
            }
        },
            FullScreen.prototype.exitFullscreen = function () {
                if (document.exitFullscreen) {
                    document.exitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                } else if (document.webkitExitFullscreen) {
                    document.webkitExitFullscreen();
                }
            },
            //toggle screen
            FullScreen.prototype.toggle_fullscreen = function () {
                var $this = this;
                var fullscreenEnabled = document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled;
                if (fullscreenEnabled) {
                    if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
                        $this.launchFullscreen(document.documentElement);
                    } else {
                        $this.exitFullscreen();
                    }
                }
            },
            //init sidemenu
            FullScreen.prototype.init = function () {
                var $this = this;
                //bind
                // $this.$fullscreenBtn.on('click', function () {
                //   $this.toggle_fullscreen();
                // });

                $('#app').on('click', '#btn-fullscreen', function () {
                    $this.toggle_fullscreen();
                });

            },
            //init FullScreen
            $.FullScreen = new FullScreen, $.FullScreen.Constructor = FullScreen

    }(window.jQuery),


//main app module
    function ($) {
        "use strict";

        var App = function () {
            this.VERSION = "1.6.0",
                this.AUTHOR = "Coderthemes",
                this.SUPPORT = "coderthemes@gmail.com",
                this.pageScrollElement = "html, body",
                this.$body = $("body")
        };

        //on doc load
        App.prototype.onDocReady = function (e) {
            // FastClick.attach(document.body);
        },
            //initilizing
            App.prototype.init = function () {
                var $this = this;
                //document load initialization
                $(document).ready($this.onDocReady);
                //init side bar - left
                $.Sidemenu.init();
                //init fullscreen
                $.FullScreen.init();
            },

            $.App = new App, $.App.Constructor = App

    }(window.jQuery),

//initializing main application module
    function ($) {
        "use strict";
        $.App.init();
    }(window.jQuery);


function initscrolls() {
    if (jQuery.browser.mobile !== true) {
        //SLIM SCROLL
        $('.slimscroller').slimscroll({
            height: 'auto',
            size: "5px"
        });

        $('.slimscrollleft').slimScroll({
            height: 'auto',
            position: 'right',
            size: "5px",
            color: '#dcdcdc',
            wheelStep: 5
        });
    }
}
function toggle_slimscroll(item) {
    if ($("#wrapper").hasClass("enlarged")) {
        //$(item).css("overflow", "inherit").parent().css("overflow", "inherit");
        $(item).siblings(".slimScrollBar").css("visibility", "hidden");
    } else {
        $(item).css("overflow", "hidden").parent().css("overflow", "hidden");
        $(item).siblings(".slimScrollBar").css("visibility", "visible");
    }
}