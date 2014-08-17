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
	chrome.tabs.executeScript(null, {file:"filloptions.js"});
});

chrome.runtime.onMessage.addListener(
		function(message, sender, sendResponse) {
	        if ( message.type == 'getTabId' )
	        {
	        	console.log(sender.tab.id + ": " + sender.tab.url);
	        	chrome.cookies.remove({url: sender.tab.url, name: sender.tab.id + '_toggle'});
	            sendResponse({ tabId: sender.tab.id });
	        }
		}      
);
