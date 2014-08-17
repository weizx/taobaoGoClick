var tabId, args, pageData, bopen = false, seconds = 0, loginSelected = true, pageState = 0;
var saveAs = saveAs
|| (navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
|| (function(view) {
	"use strict";
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link = "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			return node.dispatchEvent(event); // false if event was cancelled
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					target_view.location.href = object_url;
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				save_link.href = object_url;
				save_link.download = name;
				if (click(save_link)) {
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
					return;
				}
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			} else {
				target_view = view.open();
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;
	
	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;
	
	view.addEventListener("unload", process_deletion_queue, false);
	return saveAs;
}(self));

function clickSelectA(sizeValue)
{
	//jQuery的方法无法触发点击事件  直接html的方法可以触发
	var $selectNode = $("li[data-value='" + sizeValue + "']>a");
	if($selectNode.size()>0 && !$selectNode.parent().hasClass('tb-out-of-stock'))
	{
		if(!$selectNode.parent().hasClass('tb-selected'))
		{
			$selectNode[0].click();
		}
		return true;
	}
	return false;
	
}

function clickBuyA()
{
	var $buyNode = $('#J_juValid .tb-btn-buy>a');
	if($buyNode.size()>0)
	{
		$buyNode[0].click();
	}
	return false;
}

function clickOrderSubmitA()
{
	var $orderSubmitNode = $('#J_Go');
	if($orderSubmitNode.size()>0)
	{
		var itemid = $.cookie(tabId + '_id');
		$.cookie(itemid, null, {domain: 'taobao.com', path: '/'});
		$.cookie(tabId + "_id", null, {domain: 'taobao.com', path: '/'});
		$orderSubmitNode[0].click();
	}
}

function checkIfNeedVerify()
{
	var $maskNode = $('#J_verifyImageMask');
	if($maskNode.size() >0 )
	{
		$("body").animate({scrollTop:$maskNode.offset().top-200},50, function(){
			//$('#J_verifyImageMask>a')[0].click();
		});
		$('<div>请飞快的输入验证码：</div>').prependTo($maskNode.parent()).css({
			"float": 'left',
			"font-size": '36px',
			"width": '600px',
			"color": 'red'
		});
		var itemid = $.cookie(tabId + '_id');
		$.cookie(itemid, null, {domain: 'taobao.com', path: '/'});
		$.cookie(tabId + "_id", null, {domain: 'taobao.com', path: '/'});
		adressAlready(function(){$('#J_verifyImageMask>a')[0].click();});
		//$maskNode.find('>a:first-child').click();
		return true;
	}
	return false;
}

function adressAlready(callBack)
{
	var $addressNode = $('#address-list .J_DefaultAddr');
	if($addressNode.size()>0)
	{
		if($addressNode.hasClass('selected'))
		{
			callBack();
		}
		else
		{
			setTimeout(function(){adressAlready(callBack);}, 10);
		}
	}
}
function createEventDiv()
{
	var divNode = document.createElement('div');
	divNode.id = 'myCustomEventDiv';
	divNode.style.display = 'none';
	document.getElementsByTagName("body")[0].appendChild(divNode);
}

function queryStrings() 
{//get url querystring
    var params=document.location.search,
    reg=/(?:^\?|&)(.*?)=(.*?)(?=&|$)/g,
    temp,args={};
    while((temp=reg.exec(params))!=null)
	{
    	args[temp[1]]=decodeURIComponent(temp[2]);
	}
    return args;
};
function fetchDetailskip(url, callback) {
	  var xhr = new XMLHttpRequest();
	  xhr.onreadystatechange = function(data) {
	    if (xhr.readyState == 4) {
	      if (xhr.status == 200) {
	        var data = xhr.responseText;
	        callback(data);
	      } else {
	        callback(null);
	      }
	    }
	  }
	  // Note that any URL fetched here must be matched by a permission in
	  // the manifest.json file!
	  xhr.open('GET', url, true);
	  xhr.send();
};
function onText(data) 
{
	/*saveAs(
	          new Blob(
	              [data]
	            , {type: "text/plain;charset=GB2312"}
	        )
	        , new Date().getTime() +  "_stock.txt"
	    )*/
	var g_config = {};
	g_config.vdata = {};
	eval(data);
	var dynamicStock = g_config.DynamicStock
	var options = JSON.parse($.cookie(args.id));
	if(options.size && options.color)
	{
		if(dynamicStock && dynamicStock.sku && dynamicStock.sku[';' + options.size + ';' + options.color + ';'] && 
				Number(dynamicStock.sku[';' + options.size + ';' + options.color + ';'].stock) > 0 )
		{
			if($('#J_juValid .tb-btn-buy>a').hasClass('tb-disabled'))
			{
				setTimeout(function(){
					location.reload();
				}, 1500);
			}
			else
			{
				location.reload();
			}
		}
		else
		{
			setTimeout(function(){
				fetchDetailskip(pageData.sku.wholeSibUrl, onText);
			}, 200);
		}
	}
}

function dynamicScript(url, attrValues)
{
	var e=document, scriptNode=e.createElement("script");
	scriptNode.src=url;
	if(attrValues)
	{
		for(var p in attrValues)
		{
			scriptNode[p]=attrValues[p];
		}
	};
	e.getElementsByTagName("head")[0].appendChild(scriptNode);
}

function createCountDownTip()
{
	$('<div id="J_CountDown" class="tb-header-tip">距离开抢还有：<span></span></div>').insertAfter($('#J_Market'));
}
function convertMilsecs(ms)
{
	var sec = parseInt(ms/1000);
	if(sec < 60)
	{
		return sec + 's';
	}
	else if(sec < 3600)
	{
		return parseInt(sec/60) + 'm:' + ((sec%60)<10 ? '0' + (sec%60) : (sec%60)) + 's';
	}
	else if(sec < 3600*24)
	{
		return parseInt(sec/3600) + 'h:' + 
			(parseInt(sec%3600/60)<10 ? '0' + parseInt(sec%3600/60) : parseInt(sec%3600/60)) + 'm:' + 
			((sec%3600%60)<10 ? '0' + (sec%3600%60) : (sec%3600%60)) + 's' ;
	}
	else
	{
		return parseInt(sec/(3600*24)) + 'd ' +
			parseInt(sec%(3600*24)/3600) + 'h:' +
			(parseInt(sec%(3600*24)%3600/60)<10 ? '0' + parseInt(sec%(3600*24)%3600/60) : parseInt(sec%(3600*24)%3600/60)) + 'm:' + 
			(parseInt(sec%(3600*24)%3600%60)<10 ? '0' + parseInt(sec%(3600*24)%3600%60) : parseInt(sec%(3600*24)%3600%60)) + 's';
	}
}
function checkLoginStateOnce(data)
{
	data = "var " + data;
	eval(data);
	var state = gotoLogin(loginIndicator);
	if((pageState == 1 && ((state == 0 && $.cookie('tbpasswd')) || state == 2)) || (pageState == 2 && state == 0 && $.cookie('tbpasswd')))
	{
		setTimeout(function(){
			location.reload();
		}, 200);
	}
	else if(pageState == 2 && state == 2)
	{
		var bSuccess = true;
		var options = JSON.parse($.cookie(args.id));
		var wurl = pageData.sku.wholeSibUrl, valLoginIndicator = pageData.sku.valLoginIndicator;
		if(options.size && options.color)
		{
			if(bSuccess = clickSelectA(options.size))
			{
				if(bSuccess = clickSelectA(options.color))
				{
					bSuccess = clickBuyA();
				}
			}
		}
		if(!bSuccess)
		{
			setTimeout(function(){
				fetchDetailskip(wurl, onText);
			}, 5);
			
		}
	}
}
function checkLoginState(data)
{
	data = "var " + data;
	eval(data);
	gotoLogin(loginIndicator);
	setTimeout(function(){
		console.log('check login state');
		fetchDetailskip(pageData.sku.valLoginIndicator, checkLoginState);
	}, 180000);
}
function gotoLogin(loginIndicator)
{
	if(loginIndicator && loginIndicator.hasPhantomLoggedIn && !loginIndicator.hasLoggedIn)
	{
		chrome.runtime.sendMessage({ type: 'openLoginTab', selected: loginSelected }, function(res) {
			loginSelected = false;
			console.log('open login page ' + loginSelected);
		});
		return 0;
	}
	else if(loginIndicator && !loginIndicator.hasPhantomLoggedIn && !loginIndicator.hasLoggedIn)
	{
		chrome.runtime.sendMessage({ type: 'openLoginTab', selected: true }, function(res) {
			loginSelected = false;
		});
		return 1
	}
	return 2;
}
function addSaveBtnToLogin()
{
	$('#tip-passwd').remove();
	$('#btn-passwd').remove();
	$('<div id="tip-passwd" style="float:left;color:red;font-size:16px;line-height:38px;margin-left:50px;">输入密码，并点击→_→按钮保存→→→→→→→</div>').
		insertAfter($('#logo').css({float: "left"}));
	$('<button id="btn-passwd" class="btn-extension" style="float:right;">读取并保存密码</button>').
		insertAfter($('#tip-passwd')).click(function(){
			if(document.getElementById('J_PwdV') && document.getElementById('J_PwdV').value)
			{
				$.cookie('tbpasswd', document.getElementById('J_PwdV').value, {domain: 'taobao.com', path: '/'});
				$('#btn-passwd').html('密码保存成功');
				$('#J_VerifySubmit')[0].click();
			}
			else
			{
				$('#btn-passwd').html('没能获取密码');
			}
		}
	);
}

$(function(){
	chrome.runtime.sendMessage({ type: 'getTabId' }, function(res) {
	    tabId = res.tabId;
	    if(location.href.indexOf('http://item.taobao.com/') != -1)
		{
			//var port = chrome.extension.connect();
			document.getElementById('myCustomEventDiv').addEventListener('myCustomEvent', function() {
			  var eventData = document.getElementById('myCustomEventDiv').innerText;
			  pageData = JSON.parse(eventData);
			  //port.postMessage({message: "myCustomEvent", values: eventData});
			  args=queryStrings();
			  
			  if(args.id)
				{
					if($.cookie(args.id) && $.cookie(args.id) !== 'null')
					{
						$.cookie(tabId + '_id', args.id, {domain: 'taobao.com', path: '/'});
						var options = JSON.parse($.cookie(args.id));
						var dbst = pageData.config.item.dbst, nowT = pageData.config.now,
						wurl = pageData.sku.wholeSibUrl, valLoginIndicator = pageData.sku.valLoginIndicator;
						//dbst = dbst + 826449140;
						if(dbst > nowT + 1200)
						{
							pageState = 0;
							createCountDownTip();
							setTimeout(function(){
								location.reload();
							}, dbst - nowT - 1200); //(dbst - nowT - 1200) > 180000 ? 180000 : (dbst - nowT - 1200)
							
							setInterval(function(){
								$('#J_CountDown>span').html(convertMilsecs(dbst - nowT - seconds*1000));
								seconds++;
							}, 1000);
							fetchDetailskip(valLoginIndicator, checkLoginState);
						}
						else if(dbst > nowT)
						{
							pageState = 1;
							fetchDetailskip(valLoginIndicator, checkLoginStateOnce);
						}
						else
						{
							pageState = 2;
							fetchDetailskip(valLoginIndicator, checkLoginStateOnce);
						}
					}
				}
			});
			dynamicScript('chrome-extension://mhgnkbjdimciafmljeklonffdhaimeja/postMessage.js');
			
		}
		else if(location.href.indexOf('http://buy.taobao.com/') != -1)
		{
			if(!checkIfNeedVerify())
			{
				setTimeout(function(){adressAlready(clickOrderSubmitA);}, 5);
			}
		}
		else if(location.href.indexOf('https://login.taobao.com/') != -1)
		{
			if($.cookie('tbpasswd'))
			{
				document.getElementById('J_PwdV').value = $.cookie('tbpasswd');
				chrome.runtime.sendMessage({ type: 'getTabClosed' });
				$('#J_VerifySubmit')[0].click();
			}
			else
			{
				chrome.runtime.sendMessage({ type: 'getTabSelected'}, function(res){
					addSaveBtnToLogin();
				});
			}
		}
	});
	
});
createEventDiv();