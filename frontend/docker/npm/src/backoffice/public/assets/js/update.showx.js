var $buo_show=function(){this.op=op=window._buorgres;var jsv=23;var tv=jsv;if(Math.random()*100<40)
var tv="but2";else if(Math.random()*100<40)
var tv="but2 vaweb";else
var tv="base";var ll=this.op.l.substr(0,2);var pageurl=op.pageurl||location.hostname||"x";var langset=false;var bb=$bu_getBrowser();var burl=(/file:/.test(location.href))?"":"//browser-update.org/";if(langset)
this.op.url=burl+ll+"/update-browser.html#"+tv+":"+pageurl;else
this.op.url=burl+"update-browser.html#"+tv+":"+pageurl;var frac=1;if(Math.random()*frac<1&&!this.op.betatest){var i=new Image();i.src=burl+"count.php?what=noti&from="+bb.n+"&fromv="+bb.v+"&ref="+ escape(pageurl)+"&jsv="+jsv+"&tv="+tv+"&frac="+frac;}
function setCookie(hours){var d=new Date(new Date().getTime()+3600000*hours);document.cookie='browserupdateorg=pause; expires='+d.toGMTString()+'; path=/';}
if(this.op.reminder>0){setCookie(this.op.reminder);}
function busprintf(){var args=arguments;var data=args[0];for(var k=1;k<args.length;++k){data=data.replace(/%s/,args[k]);}
return data;}
if(tv==="base"){t='This website would like to remind you: Your browser (%s) is <b>out of date</b>. <a%s>Update your browser</a> for more security, comfort and the best experience on this site.';}
else if(tv==="but2 vaweb"){t='This website would like to remind you: <b>Your web browser (%s) is out of date</b>. For more security, comfort and the best experience on this site: <a%s>Update your browser</a>';}
else{t="<b>Your web browser (%s) is out of date</b>. For more security, comfort and the best experience on this site: <a%s>Update your browser</a>";}
var tar="";if(this.op.newwindow)
tar=' target="_blank"';this.op.text=busprintf(t,bb.t,' id="buorgul" href="'+this.op.url+'"'+tar);var div=document.createElement("div");this.op.div=div;div.id="buorg";div.className="buorg"+" var"+tv;var style='<style>.buorg {background: #FDF2AB no-repeat 14px center url('+burl+'img/small/'+bb.n+'.png);}</style>';style+='<link rel="stylesheet" href="'+burl+'testbar.css" type="text/css" />';if(tv==="base"){div.innerHTML='<div>'+ this.op.text+'<div id="buorgclose"><a id="buorga"><span id="buorgcc">Close</span><span aria-hiden="true">&times;</span></a></div></div>'+style;}
else{div.innerHTML='<div>'+ this.op.text+'<span id="buorgclose"><a id="buorga">Ignore</span></div>'+style;}
document.body.insertBefore(div,document.body.firstChild);var me=this;div.onclick=function(){if(me.op.newwindow)
window.open(me.op.url,"_blank");else
window.location.href=me.op.url;setCookie(me.op.reminderClosed);me.op.onclick(me.op);return false;};try{document.getElementById("buorgul").onclick=function(e){e=e||window.event;if(e.stopPropagation)e.stopPropagation();else e.cancelBubble=true;me.op.onclick(me.op);return true;};}
catch(e){}
var hm=document.getElementsByTagName("html")[0]||document.body;this.op.bodymt=hm.style.marginTop;hm.style.marginTop=(div.clientHeight)+"px";(function(me){document.getElementById("buorga").onclick=function(e){e=e||window.event;if(e.stopPropagation)e.stopPropagation();else e.cancelBubble=true;me.op.div.style.display="none";hm.style.marginTop=me.op.bodymt;me.op.onclose(me.op);setCookie(me.op.reminderClosed);return true;};})(me);this.op.onshow(this.op);};$buo_show();