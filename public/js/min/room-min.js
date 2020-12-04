"use strict";function _createForOfIteratorHelper(e,t){var n;if("undefined"==typeof Symbol||null==e[Symbol.iterator]){if(Array.isArray(e)||(n=_unsupportedIterableToArray(e))||t&&e&&"number"==typeof e.length){n&&(e=n);var r=0,o=function(){};return{s:o,n:function(){return r>=e.length?{done:!0}:{done:!1,value:e[r++]}},e:function(e){throw e},f:o}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}var i,a=!0,d=!1;return{s:function(){n=e[Symbol.iterator]()},n:function(){var e=n.next();return a=e.done,e},e:function(e){d=!0,i=e},f:function(){try{a||null==n.return||n.return()}finally{if(d)throw i}}}}function _unsupportedIterableToArray(e,t){if(e){if("string"==typeof e)return _arrayLikeToArray(e,t);var n=Object.prototype.toString.call(e).slice(8,-1);return"Object"===n&&e.constructor&&(n=e.constructor.name),"Map"===n||"Set"===n?Array.from(e):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_arrayLikeToArray(e,t):void 0}}function _arrayLikeToArray(e,t){(null==t||t>e.length)&&(t=e.length);for(var n=0,r=new Array(t);n<t;n++)r[n]=e[n];return r}var room_=function(e){this.id=e},ioRequestHandler_=function(){var e=function(){this.socket=io("http://192.168.15.24:9090")};return e.prototype.sendMedia=function(e,t,n){var r=this;return new Promise(function(o,i){r.socket.emit("sendMedia",{roomId:e,userId:t,sdp:n}),r.socket.on("sendMedia-ok",function(e){return o(e)}),r.socket.on("sendMedia-error",function(e){return i(e)})})},e.prototype.getMedia=function(e,t,n){var r=this;return new Promise(function(o,i){r.socket.emit("getMedia",{roomId:e,endpointSender:t,sdp:n}),r.socket.on("getMedia-ok",function(e){return o(e)}),r.socket.on("getMedia-error",function(e){return i(e)})})},e.prototype.getMedias=function(e){var t=this;return new Promise(function(n,r){t.socket.emit("getMedias",{roomId:e}),t.socket.on("getMedias-ok",function(e){return n(e)}),t.socket.on("getMedias-error",function(e){return r(e)})})},e.prototype.addIceCandidate=function(e,t,n){this.socket.emit("addIceCandidate",{roomId:e,endpoint:t,candidates:n})},e.prototype.closeMedia=function(e,t){var n=this;return new Promise(function(r,o){n.socket.emit("closeMedia",{roomId:e,endpoint:t}),n.socket.on("closeMedia-ok",function(){return r()}),n.socket.on("closeMedia-error",function(){return o(error)})})},e.prototype.onNewMedia=function(e){this.socket.on("newMedia",function(t){return e(t)})},e.prototype.onAddIceCandidateSend=function(e){this.socket.on("addIceCandidateSend",function(t){return e(t)})},e.prototype.onAddIceCandidateGet=function(e){this.socket.on("addIceCandidateGet",function(t){return e(t)})},e.prototype.onDisposeMedia=function(e){this.socket.on("disposeMedia",function(t){return e(t)})},e}(),participant_=function(){var e=function(e,t,n){this.id=e,this.room=t,this.requestHandler=n,this.peer=null,this.peerRecv={id:null},this.sendCandidates=[],this.recvCandidates=[],this.onNewMedia(),this.onAddIceCandidateSend(),this.onAddIceCandidateGet(),this.onDisposeMedia()};return e.prototype.onNewMedia=function(){var e=this;this.requestHandler.onNewMedia(function(t){var n=t.endpointSender;e.getMedia(n).then(function(){}).catch(function(e){return console.error(e)})})},e.prototype.onAddIceCandidateSend=function(){var e=this;this.requestHandler.onAddIceCandidateSend(function(t){var n=t.candidate;e.peer.addIceCandidate(n)})},e.prototype.onAddIceCandidateGet=function(){var e=this;this.requestHandler.onAddIceCandidateGet(function(t){var n=t.endpointSender,r=t.candidate;e.peerRecv[n.id].addIceCandidate(r)})},e.prototype.onDisposeMedia=function(){var e=this;this.requestHandler.onDisposeMedia(function(t){var n=t.endpointSender,r=document.getElementById(n.id);e.peerRecv[n.id].dispose(),r.remove(),delete e.peerRecv[n.id]})},e.prototype.sendMedia=function(){var e=this;return new Promise(function(t,n){var r=e.requestHandler,o=e.room.id,i=e.id,a=e.getSendVideo(i),d={localVideo:a,onicecandidate:function(t){e.sendCandidates.push(t)},mediaConstraints:{video:{width:350,height:200,framerate:15},audio:!0}},c=e.sendCandidates;e.peer=kurentoUtils.WebRtcPeer.WebRtcPeerSendonly(d,function(e){var d=this;try{if(e)throw e;this.generateOffer(async function(e,n){if(e)throw e;var s=await r.sendMedia(o,i,n),u=s.endpoint,f=s.sdpAnswer;r.addIceCandidate(o,u,c),c=[],d.processAnswer(f,function(e){if(e)throw e;return document.body.appendChild(a),t(u)})})}catch(e){return console.error(e),n(e)}})})},e.prototype.getMedia=function(e){var t=this;return new Promise(function(n,r){var o=t.requestHandler,i=t.room.id,a=t.getRecvVideo(e),d={remoteVideo:a,onicecandidate:function(e){t.sendCandidates.push(e)},mediaConstraints:{video:{width:350,height:200,framerate:15},audio:!0}},c=t.recvCandidates;t.peerRecv[e.id]=new kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(d,function(t){var d=this;try{if(t)return r(t);this.generateOffer(async function(t,r){if(t)throw t;var s=await o.getMedia(i,e,r),u=s.endpoint,f=s.sdpAnswer;o.addIceCandidate(i,u,c),c=[],d.processAnswer(f,function(e){if(e)throw e;return document.body.appendChild(a),n(u)})})}catch(t){return console.error(t),r(t)}})})},e.prototype.getMedias=function(e){return this.requestHandler.getMedias(e).then(function(e){return e.medias}).catch(function(e){return e})},e.prototype.closeMedia=function(e,t){return this.requestHandler.closeMedia(e,t)},e.prototype.getSendVideo=function(e){var t=document.createElement("video");return t.setAttribute("playsinline",""),t.setAttribute("autoplay",""),t.setAttribute("style","width: 350px; height: 200px; margin-top: 10px; border: solid"),t.id=e,t},e.prototype.getRecvVideo=function(e){var t=document.createElement("video");return t.setAttribute("playsinline",""),t.setAttribute("autoplay",""),t.setAttribute("style","width: 350px; height: 200px; margin-top: 10px; border: solid"),t.id=e.id,t},e}();!function(){var e;async function t(n){try{var r=n.target;r.onclick=null;var o=await e.sendMedia();r.onclick=function(n){return async function n(r,o){try{var i=r.target,a=document.getElementById(e.id);i.onclick=null,e.peer.dispose(),a.remove(),await e.closeMedia(e.room.id,o),i.onclick=t,i.value="send"}catch(e){console.error(e),element.onclick=function(e){return n(e,o)}}}(n,o)},r.value="close"}catch(e){console.error(e),element.onclick=t}}window.onload=function(n){var r=Math.floor(1e3*Math.random()),o=new room_(123),i=new ioRequestHandler_,a=document.getElementById("send");(async function(t){try{var n,r=await e.getMedias(t),o=_createForOfIteratorHelper(r);try{for(o.s();!(n=o.n()).done;){var i=n.value;await e.getMedia(i.endpoint)}}catch(e){o.e(e)}finally{o.f()}}catch(e){console.error(e)}})((e=new participant_(r,o,i)).room.id),a.onclick=t}}();