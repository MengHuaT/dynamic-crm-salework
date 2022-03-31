/*
 * @Author: tmh
 * @Date: 2022-3-26 16:40:19
 * @LastEditors: Andy
 * @LastEditTime: 2022-3-31 09:58:29
 * @FilePath: \JavaScript\order.js
 * @Description: 订单操作
 * @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
 */

/**
 * @description 页面加载事件函数: 
 * @param {*} executionContext  窗体上下文对象
 * @return {*} void
 */
var interval = null;
function FormOnload(executionContext) {
    let formContext = executionContext.getFormContext();
    //debugger
    interval = setInterval("submitDisplay()", 200);
    //如果状态不是草稿，页面禁用
    var status = Xrm.Page.getAttribute("new_ordersatus").getValue();
    if (status != null) {
        if (parseInt(status) != 10) {
            disabledControls();
        }
    }

    //只读。不可编辑；
    formContext.getControl('new_new_number').setDisabled(true);
    //formContext.getControl('new_account_r1').setDisabled(true);
    //formContext.getControl('new_contract_r1').setDisabled(true);
    formContext.getControl('new_orderdate').setDisabled(true);

    formContext.getControl('new_ordersatus').setDisabled(true);
    formContext.getControl('new_taxamount').setDisabled(true);
    var new_contractid_control = formContext.getControl('new_contractid');
    Xrm.Page.getAttribute("new_orderdate").setValue(new Date());


    //注册合同onchange事件
    Xrm.Page.getControl('new_new_contract_r11').getAttribute().addOnChange(function () {
        ContractOnChange(formContext);
    });
}


//页面禁用
function disabledControls() {
    Xrm.Page.ui.controls.forEach(function (item, index) {
        try {
            //页面上 因包含明细控件可能导致脚本异常
            item.setDisabled(true);
        }
        catch {

        }
    });
}


//生效按钮
function TakeEffectOnClick() {
    //debugger
    var go_next_step = true;
    let serviverUrl = Xrm.Page.context.getClientUrl();
    let parameter = "new_orderdetails?$select=new_name&$filter=new_order_r1/new_orderid eq " + Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');

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
                let info = JSON.parse(this.response);
                var productNames = "";
                if (info.value.length == 0) {
                    go_next_step = false;

                    Xrm.Utility.alertDialog("该订单不存在相应订单明细记录，不允许生效！");
                }
                else {
                    //单价无异常 
                    Xrm.Page.getAttribute('new_ordersatus').setValue(20);
                    Xrm.Page.data.save().then(function () { parent.window.location.reload(); });
                }

            }
            else {
                Xrm.Utility.alertDialog(this.statusText);
            }

        }
    };
    retrieveReq.send();

    if (!go_next_step) {
        //终止提交
        executionContext.getEventArgs().preventDefault();
    }

}


//合同更改事件函数
function ContractOnChange(formContext) {
    //#region 查合同信息
    //debugger
    let contract_options = Xrm.Page.getAttribute('new_new_contract_r11').getValue();
    if (contract_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_contracts?$select=_new_account_r1_value&$filter=new_contractid eq " + contract_options[0].id;
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
                    let contract_info = JSON.parse(this.response);

                    if (contract_info.value.length > 0) {
                        //取到选择的合同的客户ID
                        new_account_r1 = contract_info.value[0]._new_account_r1_value;

                    }
                }
                else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();
        //通过客户ID查询客户的姓名
        if (new_account_r1 != "") {
            var new_name = "";
            let serviverUrl = Xrm.Page.context.getClientUrl();
            let parameter = "new_accounts?$select=new_name&$filter=new_accountid eq " + new_account_r1;
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
                        let account_info = JSON.parse(this.response);
                        if (account_info.value.length > 0) {
                            //取到客户姓名
                            new_name = account_info.value[0].new_name;
                            //debugger
                            var lookupData = new Array();
                            lookupData[0] = new Object();
                            lookupData[0].id = "{" + new_account_r1 + "}";

                            lookupData[0].entityType = "new_account";

                            lookupData[0].name = new_name;

                            Xrm.Page.getAttribute("new_account_r11").setValue(lookupData);
                            formContext.getControl('new_account_r11').setDisabled(true);//锁
                        }

                    }
                    else {
                        Xrm.Utility.alertDialog(this.statusText);
                    }
                }
            };
            retrieveReq.send();

        }
    }
    else {
        //debugger
        Xrm.Page.getAttribute("new_account_r11").setValue(null)
        formContext.getControl('new_account_r11').setDisabled(false);//锁
    }
    //#endregion

}


//生效按钮权限    创建人的上级才可以生效
function execFecthXml() {
    var ownerid = "";
    let serviverUrl = Xrm.Page.context.getClientUrl();
    let parameter = "new_orders?$select=ownerid&$filter=new_orderid eq " + Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');
    var retrieveReq = new XMLHttpRequest();
    retrieveReq.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
    retrieveReq.setRequestHeader("Accept", "application/json");
    retrieveReq.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    retrieveReq.setRequestHeader("OData-MaxVersion", "4.0");
    retrieveReq.setRequestHeader("OData-Version", "4.0");
    retrieveReq.setRequestHeader("Prefer", "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");
    //debugger
    retrieveReq.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                if (JSON.parse(retrieveReq.responseText).value.length > 0) {
                    ownerid = JSON.parse(retrieveReq.responseText).value[0]._ownerid_value;
                }
            }
            else {
                alert(this.responseText);
            }
        }
    };
    retrieveReq.send()




    if (ownerid) {
        parameter = "systemusers?$select=_parentsystemuserid_value&$filter=systemuserid eq " + ownerid;
        var req = new XMLHttpRequest()
        req.open("GET", encodeURI(serviverUrl + "/api/data/v9.1/" + parameter), false);
        req.setRequestHeader("Accept", "application/json");
        req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
        req.setRequestHeader("OData-MaxVersion", "4.0");
        req.setRequestHeader("OData-Version", "4.0");
        req.setRequestHeader("Prefer", "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");
        //debugger
        req.onreadystatechange = function () {
            if (this.readyState == 4) {
                if (this.status == 200) {
                    if (JSON.parse(req.responseText).value.length > 0) {
                        //debugger
                        //alert("查询出上级ID====" + JSON.parse(req.responseText).value[0]._parentsystemuserid_value + "当前用户===" + Xrm.Page.context.getUserId().replace('{', '').replace('}', '').toLowerCase());
                        if (JSON.parse(req.responseText).value[0]._parentsystemuserid_value != Xrm.Page.context.getUserId().replace('{', '').replace('}', '').toLowerCase())
                        {
                            //当前登录用户 ！=当前订单的创建人的上级
                            var submitButtonID = "new_order|NoRelationship|Form|order.new_order.TakeEffect";
                            var submitBtn = window.top.document.getElementById(submitButtonID);
                            submitBtn.style.display = '';
                            submitBtn.style.display = 'none';
                        }
                    }
                }
                else {
                    alert(this.responseText);
                }
            }
        };
        req.send()
    }
}


function submitDisplay() {
    var submitButtonID = "new_order|NoRelationship|Form|order.new_order.TakeEffect";
    var submitBtn = window.top.document.getElementById(submitButtonID);
    if (JSON.stringify(submitBtn) === '{}') {
        execFecthXml();
        clearInterval(interval)
    }
}