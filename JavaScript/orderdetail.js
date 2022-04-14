/*
* @Author: tmh
* @Date: 2022-3-27 14:52:56
* @LastEditors: Andy
* @LastEditTime: 2022-3-31 09:58:42
* @FilePath: \JavaScript\orderdetail.js
* @Description: 订单明细操作
* @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
*/

var sum_quantity = 0, Usequantity = 0; //公共参数 @sum_quantity 供货数量,@Usequantity 已使用数量
var go_next_step = true;
/**
 * @description 页面加载事件函数: 
 * @param {*} executionContext  窗体上下文对象
 * @return {*} void
 */
function FormOnload(executionContext) {
    var UserId = Xrm.Page.context.getUserId();       //获取当前用户id
    var UserName = Xrm.Page.context.getUserName();       //获取当前用户的用户名
    var UserRoles = Xrm.Page.context.getUserRoles();       //获取当用户的安全角色
    debugger
    //可见性：只有关联客户的负责人 = 当前用户 &用户安全角色=业务员&已保存的记录&状态=（草稿或审批拒绝）
    let formContext = executionContext.getFormContext();
    debugger
    //字段【订单明细编号】、【订单】、【牌号】、【产品描述】、【等级】、【单价】只读
    formContext.getControl('new_number').setDisabled(true);
    //formContext.getControl('new_order_r1').setDisabled(true);
    //formContext.getControl('new_product_r11').setDisabled(true);
    formContext.getControl('new_productbrand').setDisabled(true);

    formContext.getControl('new_productdescription').setDisabled(true);
    formContext.getControl('new_price').setDisabled(true);

    if (Xrm.Page.ui.getFormType() == 1) {//新增状态
    }
    var new_orderdetailid_control = formContext.getControl('new_orderdetailid');



    //为产品搜索控件注册addPreSearch事件
    var product_id_control = formContext.getControl('new_product_r11');
    product_id_control.addPreSearch(function () {
        ProductAddFilter();
    });

    //注册订单onchange事件
    Xrm.Page.getControl('new_order_r1').getAttribute().addOnChange(function () {
        OrderOnchange(formContext);

    });


    //注册产品onchange事件
    Xrm.Page.getControl('new_product_r11').getAttribute().addOnChange(function () {
        ProductOnChange();
    });

    //注册单价事件
    Xrm.Page.getControl('new_price').getAttribute().addOnChange(function () {
        calculate(formContext);
    });

    //注册数量事件
    Xrm.Page.getControl('new_quantity').getAttribute().addOnChange(function () {
        calculate(formContext);
    });
    CheckStatus();
}

//小计计算事件
function calculate(formContext) {
    console.log("进来calculate=========")
    debugger
    var new_price = formContext.getAttribute('new_price').getValue() == null ? 0 : formContext.getAttribute('new_price').getValue();
    var quantity = formContext.getAttribute('new_quantity').getValue() == null ? 0 : formContext.getAttribute('new_quantity').getValue();
    formContext.getAttribute('new_totolprice').setValue(parseFloat(new_price) * parseFloat(quantity));


    //RetrieveUsingWebAPIFetchxml(formContext, quantity);
}


//检查页面状态实现只读
function CheckStatus() {
    debugger
    let order_options = Xrm.Page.getAttribute('new_order_r1').getValue();
    if (order_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_orders?$select=new_ordersatus&$filter=new_orderid eq " + order_options[0].id;

        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);

                    if (order_info.value.length > 0) {
                        if (order_info.value[0].new_ordersatus != 10) {
                            disabledControls();
                        }
                    }
                }


            }
            else {
                Xrm.Utility.alertDialog(this.statusText);
            }
        }
        retrieveReq.send();
    }




}


//产品OnChange事件
function ProductOnChange(formContext) {
    debugger
    //#region 查产品信息
    let product_options = Xrm.Page.getAttribute('new_product_r11').getValue();
    if (product_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_products?$select=new_productbrand,new_productdescription,new_price&$filter=new_productid eq " + product_options[0].id;

        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let product_info = JSON.parse(this.response);

                    if (product_info.value.length > 0) {
                        //为订单明显实体得产品信息赋值
                        Xrm.Page.getAttribute('new_productbrand').setValue(product_info.value[0].new_productbrand);
                        Xrm.Page.getAttribute('new_productdescription').setValue(product_info.value[0].new_productdescription);
                        Xrm.Page.getAttribute('new_price').setValue(product_info.value[0].new_price);

                    }
                }
                else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();

    }
    else {
        Xrm.Page.getAttribute('new_productbrand').setValue(null);
        Xrm.Page.getAttribute('new_productdescription').setValue(null);
        Xrm.Page.getAttribute('new_price').setValue(null);
    }
    //#endregion
}


//订单发生变化 根据订单取产品
function OrderOnchange(formContext) {
    Xrm.Page.getAttribute("new_product_r11").setValue(null)
    Xrm.Page.getAttribute('new_productbrand').setValue(null);
    Xrm.Page.getAttribute('new_productdescription').setValue(null);
    Xrm.Page.getAttribute('new_price').setValue(null);
}


//产品查找事件
function ProductAddFilter() {
    debugger
    var fetchXmlfilter = "", filter = "";
    var orderId = "";
    let fetchXml = "";

    let order_options = Xrm.Page.getAttribute('new_order_r1').getValue();
    if (order_options) {
        orderId = order_options[0].id.replace('{', '').replace('}', '');
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_orders?$select=_new_new_contract_r11_value&$filter=new_orderid eq " + orderId;
        var new_contract_r11 = "";
        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);

                    if (order_info.value.length > 0) {
                        new_contract_r11 = order_info.value[0]._new_new_contract_r11_value;
                    }
                } else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();



        if (new_contract_r11 != "") {
            debugger;
            var pFetchXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='true'>\
                <entity name = 'new_product' >\
<attribute name='new_productid'/>\
<attribute name='new_name'/>\
<attribute name='createdon'/>\
<order attribute='new_name' descending='false'/>\
<link-entity name='new_contractdetail' from='new_product_r11' to='new_productid' link-type='inner' alias='ac'>\
<filter type='and'>\
<condition attribute='new_contract_r11' operator='eq'  uitype='new_contract' value='"+ new_contract_r11 + "'/>\
</filter></link-entity></entity ></fetch >";



            var id = "{00000000-0000-0000-0000-000000000001}";
            var pEntityName = "new_product";
            var pViewDisplayName = "产品查找视图";

            var pLayoutXml = "<grid name='resultset' object='10188' jump='new_name' select='1' icon='1' preview='1'>\
<row name='result' id='new_productid'>\
<cell name='new_name' width='200' imageproviderfunctionname='' imageproviderwebresource='$webresource:'/>\
<cell name='new_level' width='100'/>\
<cell name='new_productnumber' width='150' imageproviderfunctionname='' imageproviderwebresource='$webresource:'/>\
<cell name='new_productbrand' width='100'/><cell name='new_price' width='100'/>\
<cell name='new_productdescription' width='300' imageproviderfunctionname='' imageproviderwebresource='$webresource:'/>\
<cell name='createdon' width='125'/></row></grid>"


            Xrm.Page.getControl('new_product_r11').addCustomView(id, pEntityName, pViewDisplayName, pFetchXml, pLayoutXml, false);
            Xrm.Page.getControl('new_product_r11').setDefaultView(id);




            //var filter = "", fetchXmlfilter = '<filter type = "and"><condition attribute="new_productid" operator="null" /></filter>';

            //let serviverUrl = Xrm.Page.context.getClientUrl();
            //let parameter = "new_contractdetails?$select=new_product_r11&$filter=_new_contract_r11_value eq " + new_contract_r11;
            //var retrieveReq = new XMLHttpRequest();
            //retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
            //retrieveReq.setRequestHeader("Accept", "application/json");
            //retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
            //retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
            //retrieveReq.setRequestHeader("OData-Version", "4.0");
            //retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
            //retrieveReq.onreadystatechange = function () {
            //    if (this.readyState == 4) {
            //        retrieveReq.onreadystatechange = null;
            //        if (this.status == 200) {
            //            if (JSON.parse(this.response).value.length > 0) {
            //                var data = JSON.parse(this.response).value;
            //                data.forEach(function (item) {
            //                    filter += '<condition attribute="new_productid" operator="eq" value="' + item._new_product_r11_value + '" />';
            //                })
            //            }
            //            if (JSON.parse(this.response).value.length > 1) {
            //                fetchXmlfilter = ' <filter type = "or"> ' + filter + '</filter>';
            //            }
            //            if (JSON.parse(this.response).value.length == 1) {
            //                fetchXmlfilter = ' <filter type = "and"> ' + filter + '</filter>';
            //            }




            //        } else {
            //            var error = JSON.parse(this.response).error;
            //        }
            //    }
            //}
            //retrieveReq.send();
        }
        //Xrm.Page.getControl('new_product_r11').addCustomFilter(fetchXmlfilter);

    }

}


//页面禁用


//当前产品供货数量判断
function RetrieveUsingWebAPIFetchxml(formContext, quantity) {
    debugger;
    console.log("进来RetrieveUsingWebAPIFetchxml=========")
    var orderId = "";
    let order_options = Xrm.Page.getAttribute('new_order_r1').getValue();
    if (order_options) {
        orderId = order_options[0].id.replace('{', '').replace('}', '');
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_orders?$select=_new_new_contract_r11_value&$filter=new_orderid eq " + orderId;
        var new_contract_r11 = "";
        var retrieveReq = new XMLHttpRequest();
        retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq.setRequestHeader("Accept", "application/json");
        retrieveReq.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq.setRequestHeader("OData-Version", "4.0");
        retrieveReq.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);

                    if (order_info.value.length > 0) {
                        new_contract_r11 = order_info.value[0]._new_new_contract_r11_value;
                    }
                } else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();
    }


    if (new_contract_r11) {
        serviverUrl = Xrm.Page.context.getClientUrl();
        parameter = "new_orders?$select=new_orderid&$filter=_new_new_contract_r11_value eq " + new_contract_r11;
        var new_orderids = "", filterxml = "";
        var retrieveReq2 = new XMLHttpRequest();
        retrieveReq2.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        retrieveReq2.setRequestHeader("Accept", "application/json");
        retrieveReq2.setRequestHeader("Content-Type", "application/json;charset=utf-8");
        retrieveReq2.setRequestHeader("OData-MaxVersion", "4.0");
        retrieveReq2.setRequestHeader("OData-Version", "4.0");
        retrieveReq2.setRequestHeader("Prefer", "oadata.include-annotations=\"*\"");
        retrieveReq2.onreadystatechange = function () {
            if (this.readyState === 4) {
                retrieveReq2.onreadystatechange = null;
                if (this.status === 200) {
                    let order_info = JSON.parse(this.response);
                    debugger
                    if (order_info.value.length > 0) {
                        order_info.value.forEach(function (item) {
                            new_orderids += '<condition attribute="new_order_r1" operator="eq" value="' + item.new_orderid + '" />';
                        })
                    }
                    if (order_info.value.length == 1) {
                        filterxml = "<filter type='and'>" + new_orderids + "</filter>";
                    }
                    else if (order_info.value.length > 1) {
                        filterxml = "<filter type='or'>" + new_orderids + "</filter>";
                    }
                } else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq2.send();
    }




    let product_options = Xrm.Page.getAttribute('new_product_r11').getValue();
    if (product_options) {

        sum_quantity = 0;
        var fetchxml = "<fetch mapping='logical' aggregate='true' version='1.0'>\
                        <entity name = 'new_orderdetail'>\
                    <attribute name='new_quantity' alias='sum_new_quantity' aggregate='sum'/>\
                    <filter>\
                      <condition attribute='new_product_r11' operator='eq' value='"+ product_options[0].id + "'/>\
                        "+ filterxml + "\
                    </filter>\
                    <link-entity name='new_order' from='new_orderid' to='new_order_r1' link-type='inner'/>\
                  </entity></fetch>";
        var req = new XMLHttpRequest();
        req.open("GET", encodeURI(Xrm.Page.context.getClientUrl() + "/api/data/v9.1/new_orderdetails?fetchXml=" + encodeURI(fetchxml), false), false);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.onreadystatechange = function () {
            if (this.readyState == 4) {
                req.onreadystatechange = null;
                if (this.status == 200) {
                    if (JSON.parse(this.response).value.length > 0)
                        var data = JSON.parse(this.response).value;
                    Usequantity = data[0].sum_new_quantity ? data[0].sum_new_quantity : 0;
                }
                else {
                    var error = JSON.parse(this.response).error;
                }
            }
        };
        req.send();



        fetchxml = "<fetch mapping='logical' aggregate='true' version='1.0'>\
        <entity name = 'new_contractdetail'>\
    <attribute name='new_quantity' alias='sum_new_quantity' aggregate='sum'/>\
    <filter  type = 'and'>\
      <condition attribute='new_product_r11' operator='eq' value='"+ product_options[0].id + "'/>\
      <condition attribute='new_contract_r11' operator='eq' value='"+ new_contract_r11 + "'/>\
    </filter></entity></fetch>";
        //<link-entity name='new_order' from='new_new_contract_r11' to='new_contract_r11' alias='o' link-type='inner'/>\
        var reqHttp = new XMLHttpRequest();
        reqHttp.open("GET", encodeURI(Xrm.Page.context.getClientUrl() + "/api/data/v9.1/new_contractdetails?fetchXml=" + encodeURI(fetchxml), false), false);
        reqHttp.setRequestHeader("Accept", "application/json");
        reqHttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        reqHttp.setRequestHeader("OData-MaxVersion", "4.0");
        reqHttp.setRequestHeader("OData-Version", "4.0");
        reqHttp.onreadystatechange = function () {
            if (this.readyState == 4) {
                reqHttp.onreadystatechange = null;
                if (this.status == 200) {
                    if (JSON.parse(this.response).value.length > 0)
                        var data = JSON.parse(this.response).value;
                    sum_quantity = data[0].sum_new_quantity ? data[0].sum_new_quantity : 0;
                }
                else {
                    var error = JSON.parse(this.response).error;
                }
            }
        };
        reqHttp.send();
        sum_quantity = sum_quantity - Usequantity;//当前产品剩余供货数
        if (parseFloat(quantity) > parseFloat(sum_quantity)) {
            Xrm.Utility.alertDialog("订单数量【" + quantity + "】超出合同中可供货数量【" + sum_quantity + "】，请重新填写!");
            go_next_step = false;
        }
        else
            go_next_step = true;
    }
}

function FormOnSave(executionContext) {
    var formContext = executionContext.getFormContext();
    var quantity = formContext.getAttribute('new_quantity').getValue() == null ? 0 : formContext.getAttribute('new_quantity').getValue();
    RetrieveUsingWebAPIFetchxml(formContext, quantity)
    if (!go_next_step) {
        //终止提交
        executionContext.getEventArgs().preventDefault();
    }
}
