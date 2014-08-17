// Called when the user clicks on the browser action.
chrome.browserAction.onClicked.addListener(function(tab) {
	/*chrome.cookies.get({url: tab.url, name: tab.id + '_toggle'}, function(cookie){
		if(cookie)
		{
			if(cookie.value == 'open')
			{
				chrome.tabs.sendMessage(tab.id, {type: "close", tab: tab.id}, function(response) {
					if(response.state)
					{
						chrome.cookies.set({url: tab.url, name: tab.id + '_toggle', value: 'close'});
					}
				    console.log(response.state + ": close" );
				  });
			}
			else if(cookie.value == 'close')
			{
				chrome.tabs.sendMessage(tab.id, {type: "open", tab: tab.id}, function(response) {
					if(response.state)
					{
						chrome.cookies.set({url: tab.url, name: tab.id + '_toggle', value: 'open'});
					}
				    console.log(response.state + ": open" );
				  });
			}
			
		}
		else
		{
			chrome.cookies.set({url: tab.url, name: tab.id + '_toggle', value: 'open'});
			 chrome.tabs.executeScript(null, {file:"filloptions.js"});
		}
	});*/
	chrome.tabs.getSelected(null, function(tab){
		if(tab.url.indexOf('http://item.taobao.com/') != -1 || tab.url.indexOf('https://login.taobao.com/') != -1)
		{
			chrome.tabs.executeScript(null, {file:"filloptions.js"});
		}
	});
	
});

chrome.runtime.onMessage.addListener(
		function(message, sender, sendResponse) {
	        if ( message.type == 'getTabId' )
	        {
	        	console.log("getTabId   " + sender.tab.id + ": " + sender.tab.url);
	        	chrome.cookies.remove({url: sender.tab.url, name: sender.tab.id + '_toggle'});
	            sendResponse({ tabId: sender.tab.id });
	        }
	        else if (message.type == 'openLoginTab')
        	{
	        	console.log('getTabId   ' + sender.tab.id + ": " + sender.tab.url);
	        	chrome.tabs.getAllInWindow(null, function(tabs){
	        		tabs.forEach(function(tab){
	        			if(tab.url.indexOf('https://login.taobao.com/member/login.jhtml') !== -1)
        				{
	        				chrome.tabs.remove(tab.id, function(){
	        					console.log('tab: ' + tab.id + 'closed');
	        				});
        				}
	        		});
	        	});
	        	chrome.tabs.create({
	        		url: 'https://login.taobao.com/member/login.jhtml',
	        		selected: message.selected || false
	        	});
	        	sendResponse({ tabId: sender.tab.id });
        	}
	        else if(message.type == 'getTabSelected')
        	{
	        	chrome.tabs.update(sender.tab.id, {selected: true});
	        	sendResponse({ tabId: sender.tab.id });
        	}
	        else if(message.type == 'getTabClosed')
        	{
	        	setTimeout(function(){
	        		chrome.tabs.remove(sender.tab.id);
	        	}, 2000);
        	}
		}      
);
