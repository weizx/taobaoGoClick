var sizeMap = {'XS': '20509:28313', 'S': '20509:28314', 'M': '20509:28315', 'L': '20509:28316', 
		'XL': '20509:28317', 'XXL': '20509:28318', 'XXXL': '20509:28319'};
var colorMap = {'白色': '1627207:28320', '紫色': '1627207:3232479', '浅绿色': '1627207:30156', '灰色':'1627207:28332', 
		'浅蓝色': '1627207:3232484', '黑色': '1627207:28341', '蓝色': '1627207:28338', '红色': '1627207:28326',
		'绿色': '1627207:28335'};
var sizeOptions = [], colorOptions = [];
function createOptionDiv(text)
{
	if(text)
	{
		var $htmlNode = $(text);
		$htmlNode.find('.tb-skin ul[data-property]:eq(0)>li').each(function(i, item){
			sizeOptions.push({'value': $(this).attr('data-value'), 'label': $(this).find('>a>span').html()});
		});
		$htmlNode.find('.tb-skin ul[data-property]:eq(1)>li').each(function(i, item){
			colorOptions.push({'value': $(this).attr('data-value'), 'label': $(this).find('>a>span').html()});
		});
		var $optionDiv = $('<div id="option_wrapper_outer"></div>').prependTo($('body'));
		var $wrapper = $('<div id="option_wrapper"></div>').appendTo($optionDiv);
		var $optionsNode = $('<ul><li><div style="width:290px;">' + 
				'<p style="font-size:24px;line-height:36px;color:white;">请选择尺寸和颜色</p>' + 
				'</div> </li>' +
				/*'<li><div style="width:120px;">' +
				'<label for="chk_input_index_switcher"><input type="checkbox" id="chk_input_index_switcher">' + 
				'<span id="input_index_label">输入选择序号</span></label>' + 
				'</div></li>' +*/
				/*'<li><div style="width:190px;">' + 
				'<p><input id="sizeSelected" name="size" type="text" placeholder="请从页面选择尺寸..." maxlength="50"></p>' + 
				'</div></li>' + */
				'<li><div style="width:190px;">' + 
				'<p><label>请选择尺码：<select id="sizeSelected" name="size"></select></label></p>' + 
				/*'<li><div style="width:190px;">' + 
				'<p><input id="colorSelected" name="color" type="text" placeholder="请从页面选择颜色..." maxlength="50"></p>' + 
				'</div> </li>' +  */
				'<li><div style="width:240px;">' + 
				'<p><label>请选择颜色：<select id="colorSelected" name="color" style="width: 153px;"></select></label></p>' +
				'<li><div class="opt-button">' + 
	            '<button id="btn-save" class="btn">保存</button>' +
	            '</div></li>' +
	            '<li><div class="opt-button">' + 
	            '<button id="btn-go" class="btn">开始</button>' +
	            '</div></li>' +
	            '<li><div style="width:190px;">' +
	            '<p id="opInfo" style="font-size:14px;line-height:36px;color:yellow;"></p>' + 
	            '</div></li>' +
				'</ul>').appendTo($wrapper);
		
		$optionDiv.hide();
		$optionDiv.slideDown();
		bopen = true;
		if(sizeOptions.length > 0 && colorOptions.length > 0)
		{
			addSelectOption($('#sizeSelected')[0], sizeOptions);
			addSelectOption($('#colorSelected')[0], colorOptions);
			$('#btn-save').click(function(){
				var size, color, dbst = pageData.config.item.dbst, nowT = pageData.config.now, 
				wurl = pageData.sku.wholeSibUrl, itemId = pageData.config.item.id;
				if(itemId)
				{
					if($('#J_isku ul[data-property]>li.tb-selected').size() == 2 )
					{
						$('#sizeSelected')[0].value = $('#J_isku ul[data-property]:eq(0)>li.tb-selected').attr('data-value');
						$('#colorSelected')[0].value = $('#J_isku ul[data-property]:eq(1)>li.tb-selected').attr('data-value');
						size = $('#sizeSelected')[0].value;
						color = $('#colorSelected')[0].value;
						//$.cookie(itemId, JSON.stringify({'size': size, 'color': color, 'dbst': dbst, 'nowT': nowT, 'wurl': wurl}));
						$.cookie(itemId, JSON.stringify({'size': size, 'color': color}));
					}
					else if($('#sizeSelected')[0].value && $('#colorSelected')[0].value)
					{
						size = $('#sizeSelected')[0].value;
						color = $('#colorSelected')[0].value;
						$.cookie(itemId, JSON.stringify({'size': size, 'color': color}));
					}
					$('#opInfo').html('保存成功,可以点击开始啦');
				}
			});
			$('#btn-go').click(function(){
				location.reload();
			});
		}
	}
}
function addSaveBtnToLogin()
{
	$('#btn-passwd').remove();
	$('<button id="btn-passwd" class="btn-extension" style="float:right;">读取并保存密码</button>').
		insertAfter($('#logo').css({float: "left"})).click(function(){
			if(document.getElementById('J_PwdV') && document.getElementById('J_PwdV').value)
			{
				//$.cookie('tbpasswd', document.getElementById('J_PwdV').value);
				$('#btn-passwd').html('密码保存成功');
			}
			else
			{
				$('#btn-passwd').html('没能获取密码');
			}
		}
	);
}
function addSelectOption(selectNode, options)
{
	if(selectNode)
	{
		for(var i=0; i< options.length; i++)
		{
			selectNode.options.add(createOption(options[i]));
		}
	}
}
function createOption(option)
{
	var optionNode = document.createElement('option');
	optionNode.value = option.value;
	optionNode.text = option.label;
	return optionNode;
}
function hideOptionDiv()
{
	$('#option_wrapper_outer').slideUp("normal");
}
function showOptionDiv()
{
	$('#option_wrapper_outer').slideDown("normal");
}
function slideToogleDiv()
{
	$('#option_wrapper_outer').slideToggle("normal");
}

args=queryStrings();
if(bopen)
{
	if(location.href.indexOf('http://item.taobao.com/') != -1)
	{
		slideToogleDiv();
	}
	else if(location.href.indexOf('https://login.taobao.com/') != -1)
	{
		addSaveBtnToLogin();
	}
}
else
{
	debugger;
	if(location.href.indexOf('http://item.taobao.com/') != -1)
	{
		fetchDetailskip(location.href, createOptionDiv);
	}
	else if(location.href.indexOf('https://login.taobao.com/') != -1)
	{
		addSaveBtnToLogin();
	}
}

/*chrome.runtime.onMessage.addListener(
		  function(request, sender, sendResponse) {
			  if(request.tab == tabId)
			  {
				  console.log(sender.tab ?
			                "from a content script:" + sender.tab.url :
			                "from the extension");
			    
			    if (request.type == "open")
		    	{
			    	slideToogleDiv();
			    	sendResponse({state: "open success "});
		    	}
			    else if(request.type == "close")
		    	{
			    	slideToogleDiv();
			    	sendResponse({state: "hide success "});
		    	}
			  }
  });*/