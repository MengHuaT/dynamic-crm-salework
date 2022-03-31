/*
 * @Author: 田孟桦
 * @Date: 2022-03-10
 * @LastEditors: 田孟桦
 * @LastEditTime: 2022-03-14
 * @FilePath: \JavaScript\orderdetails.js
 * @Description: 客户订单明细
 * @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
 */


//订单明细页面加载事件
function FormOnload(executionContext) {
    let formContext = executionContext.getFormContext();
    //a.编号、总价
    formContext.getControl('new_number').setDisabled(true);
    formContext.getControl('new_price').setDisabled(true);

    //获取当前纪录主键Id
    let orderDeteils_id = formContext.data.entity.getId();


    var new_oderid_control = formContext.getControl('new_oderid');
    //为订单搜索控件注册addPreSearch事件
    new_oderid_control.addPreSearch(function () {
        OrderAddFilter();
    });

    if (!orderDeteils_id) {
        //产生订单编码，并赋值控件；
        let orderNumber = '';
        formContext.getAttribute('new_number').setValue(orderNumber);
    }


    //var new_SKU = formContext.getAttribute('new_sku').getValue();
    //if (new_SKU) {
    //    var serviverUrl = Xrm.Page.context.getClientUrl();
    //    var parameter = "new_orderdetailses?$select=new_orderdetailsid&$filter=new_sku%20eq%20%27" + new_SKU + "%27";

    //    var req = new XMLHttpRequest();
    //    req.open("GET", serviverUrl + "/api/data/v9.1/" + parameter, false);

    //    req.setRequestHeader("Accept", "application/json");
    //    req.setRequestHeader("Content-Type", "application/json;charset=utf-8");
    //    req.setRequestHeader("OData-MaxVersion", "4.0");
    //    req.setRequestHeader("OData-Version", "4.0");
    //    req.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");

    //    req.onreadystatechange = function () {
    //        if (this.readyState === 4) {
    //            req.onreadystatechange = null;
    //            if (this.status == 200) {
    //                var results = JSON.parse(this.response);
    //            } else {
    //                alert(this.statusText);
    //            }

    //        };

    //    }
    //    req.send();
    //}
}



//为所属订单字段注册OrderAddFilter事件:
function OrderAddFilter() {
    let fetchXml = '<filter type="and"><condition attribute="new_orderstatus" operator="ne" value="30" /></filter>';
    Xrm.Page.getControl('new_oderid').addCustomFilter(fetchXml);

}

//数量输入计算
function quantityOnChange() {
    totalPrice();
}

//单价输入计算
function unitPriceOnChange() {
    totalPrice();
}

//总价计算
function totalPrice() {
    var quantity = Xrm.Page.getAttribute("new_quantity").getValue();
    var unitPrice = Xrm.Page.getAttribute("new_unitprice").getValue();
    Xrm.Page.getAttribute("new_price").setValue(isNaN(parseInt(quantity) * parseFloat(unitPrice)) ? 0 : parseInt(quantity) * parseFloat(unitPrice));
}

//保存事件
function FormOnSave(executionContext) {
    debugger
    var formContext = executionContext.getFormContext();
    var new_SKU = formContext.getAttribute('new_sku').getValue();
    var new_oderId = formContext.getAttribute('new_oderid').getValue();

    if (new_SKU && new_oderId && formContext.data.entity.getId() == "") {
        var serviverUrl = Xrm.Page.context.getClientUrl();
        //var parameter = "new_orderdetailses?$select=new_orderdetailsid&$filter=new_sku%20eq%20%27" + new_SKU + "%27%20and%20new_oderid%20eq%20" + new_oderId[0].id;
        var parameter = "new_orderdetailses?$select=new_orderdetailsid&$filter=new_sku%20eq%20%27" + new_SKU + "%27%20and%20_new_oderid_value%20eq%20" + encodeURI(new_oderId[0].id);

        var req = new XMLHttpRequest();
        req.open("GET", serviverUrl + "/api/data/v9.1/" + parameter, false);
        debugger
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");

        req.onreadystatechange = function () {
            if (this.readyState === 4) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    var results = JSON.parse(this.response);
                    if (results.value.length > 0) {
                        Xrm.Utility.alertDialog("sku在该订单已存在[" + new_SKU + "]");
                        executionContext.getEventArgs().preventDefault();
                    }
                } else {
                    alert(this.statusText);
                }
            };
        }
        req.send();
    }



}

