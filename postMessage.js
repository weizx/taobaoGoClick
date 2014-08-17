var customEvent = document.createEvent('Event');
customEvent.initEvent('myCustomEvent', true, true);

function fireCustomEvent(data) {
  var hiddenDiv = document.getElementById('myCustomEventDiv');
  hiddenDiv.innerText = data
  hiddenDiv.dispatchEvent(customEvent);
}

function jsonify(obj, excludes)
{
    var seen = [];
    var json = JSON.stringify(obj, function(key, value){
    	if(excludes && excludes instanceof Array && excludes.indexOf(key) !== -1)
		{
    		return;
		}
    	else if (typeof value === 'object' && value !== null) 
        {
            if ( seen.indexOf(value) !== -1 ) 
            {
            	//Circular reference found, discard key
                return ;
            }
            seen.push(value);
        }
        
        return value;
    });
    return json;
}
var src_config = g_config;
var new_config = {
		item: g_config.idata.item,
		now: g_config.vdata.sys.now
}
var src_sku = Hub.config.config.sku;
var new_sku = {
		valItemId: src_sku.valItemId,
		rstItemId: src_sku.rstItemId,
		rstShopId: src_sku.rstShopId,
		valLoginIndicator: src_sku.valLoginIndicator,
		wholeSibUrl: src_sku.wholeSibUrl
};
fireCustomEvent(jsonify({'config': new_config, 'sku': new_sku}));
