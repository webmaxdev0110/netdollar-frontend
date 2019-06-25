/**
* Theme: Ubold Admin Template
* Author: Coderthemes
* Module/App: Main Js
*/


(function($){

  'use strict';

  function initNavbar () {

    $('.navbar-toggle').on('click', function(event) {
      $(this).toggleClass('open');
      $('#navigation').slideToggle(400);
    });

    $('.navigation-menu>li').slice(-1).addClass('last-elements');

    $('.navigation-menu li.has-submenu a[href="#"]').on('click', function(e) {
      if ($(window).width() < 992) {
        e.preventDefault();
        $(this).parent('li').toggleClass('open').find('.submenu:first').toggleClass('open');
      }
    });


  }

  function setMobileMenuSize(){

    $(window).resize(function () {
      if ($('#navigation').css('display') == 'block') {
        $('#mobile-spec-menu').css('max-height', $(window).height() - $('.topbar-main').height());
      }
    });

  }

  function init () {
    initNavbar();
    setMobileMenuSize();
  }


  init();

})(jQuery)

