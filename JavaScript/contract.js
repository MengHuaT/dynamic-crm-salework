/// <reference path="salecmd.js" />
/*
 * @Author: tmh
 * @Date: 2022-3-24 10:02:17
 * @LastEditors: tmh
 * @LastEditTime: 2022-3-31 10:00:46
 * @FilePath: \JavaScript\contact.js
 * @Description: 合同操作
 * @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
 */

/**
 * @description 页面加载事件函数: 
 * @param {*} executionContext  窗体上下文对象
 * @return {*} void
 */

//var interval = null;
function FormOnload(executionContext) {
    debugger
    //interval = setInterval("test()", 200);

    var lup = new Array();
    lup[0] = new Object();
    lup[0].id = "{1ABED600-FA9D-EC11-9FA1-000C29E4ACF6}";
    lup[0].name = "人民币";
    lup[0].entityType = "transactioncurrency";
    Xrm.Page.getAttribute("new_transactioncurrency_r1").setValue(lup);

    //Xrm.Page.getAttribute("new_name").setValue([{ id: "{C54AA716-8DAA-EC11-9FB3-000C29E4ACF6}", name: "联系人1", entityType: "new_contacts" }]);

    //可见性：只有关联客户的负责人 = 当前用户 &用户安全角色=业务员&已保存的记录&状态=（草稿或审批拒绝）
    let formContext = executionContext.getFormContext();





    //【税号】、【合同总金额】、【合同总金额（大写）】、【底价金额】、【底价金额（大写）】、【货币】只读。不可编辑；
    formContext.getControl('new_number').setDisabled(true);
    formContext.getControl('new_approvalstatus').setDisabled(true);
    formContext.getControl('new_contract_r1').setDisabled(true);
    formContext.getControl('new_address').setDisabled(true);

    formContext.getControl('new_postalcode').setDisabled(true);
    formContext.getControl('new_fax1').setDisabled(true);
    formContext.getControl('new_fax2').setDisabled(true);

    //formContext.getControl('new_taxnumber').setDisabled(true);
    formContext.getControl('new_amount').setDisabled(true);
    formContext.getControl('new_rmbamount').setDisabled(true);
    formContext.getControl('new_lowestamount1').setDisabled(true);
    formContext.getControl('new_lowestamount').setDisabled(true);
    formContext.getControl('new_transactioncurrency_r1').setDisabled(true);



    //var lookupData = new Array();
    //lookupData[0] = new Object();
    //lookupData[0].id = "{1ABED600-FA9D-EC11-9FA1-000C29E4ACF6}";
    //lookupData[0].entityType = "9105";
    //lookupData[0].name = "人民币";
    //Xrm.Page.getAttribute("new_transactioncurrency_r1").setValue(lookupData[0]);

    //formContext.getControl('new_transactioncurrency_r1').setDisabled(true);

    if (Xrm.Page.getAttribute('new_contract_r1').getValue() == null) {//新增状态
        formContext.getControl('new_contract_r1').setVisible(false);//隐藏源合同按钮
    }
    var new_contractid_control = formContext.getControl('new_contractid');


    //注册客户onchange事件
    Xrm.Page.getControl('new_account_r1').getAttribute().addOnChange(function () {
        CustomerOnChange(formContext);
    });
    var new_contact_r1_control = formContext.getControl('new_contact_r1');
    //为联系人搜索控件注册addPreSearch事件
    new_contact_r1_control.addPreSearch(function () {
        ContactAddFilter();
    });


    //注册联系人onchange事件
    Xrm.Page.getControl('new_contact_r1').getAttribute().addOnChange(function () {
        contactOnChange(formContext);
    });


    //注册失效日期onchange事件
    Xrm.Page.getControl('new_enddate').getAttribute().addOnChange(function () {
        dateCheck();
    });



    //注册onchange事件
    Xrm.Page.getControl('new_province_r1').getAttribute().addOnChange(function () {
        provinceOnChange(formContext, 1);
    });



    //为市搜索控件注册addPreSearch事件
    var new_city_id_control = formContext.getControl('new_city_r1');
    new_city_id_control.addPreSearch(function () {
        cityAddFilter();
    });

    contactOnChange(formContext);
    provinceOnChange(formContext, 0);



    //如果状态不是草稿，页面禁用
    var status = Xrm.Page.getAttribute("new_approvalstatus").getValue();
    if (status != null) {
        if (parseInt(status) != 10 && parseInt(status) != 40) {
            disabledControls();
        }
    }


}
//提交按钮显示权限判断
function test() {
    debugger
    var UserId = Xrm.Page.context.getUserId();       //获取当前用户id
    var UserName = Xrm.Page.context.getUserName();       //获取当前用户的用户名
    var UserRoles = Xrm.Page.context.getUserRoles();       //获取当用户的安全角色
    var roleXml = "<fetch version='1.0' output-format='xml-platform' mapping='logical' distinct='false'>\
                        <entity name='systemuserroles'>\
        <all-attributes/>\
    <filter>\
      <condition attribute='systemuserid' operator='eq' value='"+ UserId +"'/>\
    </filter>\
    <link-entity name='role' from='roleid' to='roleid' link-type='inner'>\
         <filter type='or'>\
        <condition attribute='name' operator='like' value='%业务员%'/>\
        <condition attribute='name' operator='like' value='%市场营销经理%'/>\
      </filter>\
    </link-entity>\
  </entity></fetch>";

    var entityName = "systemuserrolescollection";
    var Count = 0;
    let serviverUrl = Xrm.Page.context.getClientUrl();
    var fetchStr = serviverUrl + "/api/data/v9.1/" + entityName + "?fetchXml=" + roleXml;
    var req = new XMLHttpRequest()
    req.open("GET", encodeURI(fetchStr), false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");
    req.setRequestHeader("Prefer", "odata.include-annotations=\"OData.Community.Display.V1.FormattedValue\"");
    req.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                if (JSON.parse(req.responseText).value.length > 0) {
                    Count = JSON.parse(req.responseText).value.length;
                }

            }
            else {
                alert(this.responseText);
            }
        }
    };
    req.send();
    return Count > 0;
}

//客户更改事件函数: 
function CustomerOnChange(formContext) {
    //#region 查客户信息
    Xrm.Page.getAttribute("new_contact_r1").setValue(null);
    Xrm.Page.getAttribute("new_phone").setValue(null);

    let customer_options = Xrm.Page.getAttribute('new_account_r1').getValue();
    if (customer_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_accounts?$select=new_name,new_address,new_postalcode,new_fax1,new_fax2&$filter=new_accountid eq " + customer_options[0].id;

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
                    let customer_info = JSON.parse(this.response);

                    if (customer_info.value.length > 0) {
                        //为合同实体得客户信息赋值

                        Xrm.Page.getAttribute('new_address').setValue(customer_info.value[0].new_address);
                        Xrm.Page.getAttribute('new_postalcode').setValue(customer_info.value[0].new_postalcode);
                        Xrm.Page.getAttribute('new_fax1').setValue(customer_info.value[0].new_fax1);
                        Xrm.Page.getAttribute('new_fax2').setValue(customer_info.value[0].new_fax2);

                        //客户有值  联系人锁定
                        //formContext.getControl('new_contact_r1').setDisabled(true);
                    }
                    else {
                        Xrm.Page.getAttribute("new_contact_r1").setValue(null)
                        Xrm.Page.getAttribute('new_phone').setValue(null);
                        //formContext.getControl('new_contact_r1').setDisabled(false);//客户没值 联系人解锁
                    }


                }
                else {
                    Xrm.Utility.alertDialog(this.statusText);
                }
            }
        };
        retrieveReq.send();

        //ContactAddFilter();

    }
    else {
        Xrm.Page.getAttribute("new_account_r1").setValue(null);
        Xrm.Page.getAttribute('new_address').setValue(null);
        Xrm.Page.getAttribute('new_postalcode').setValue(null);
        Xrm.Page.getAttribute('new_fax1').setValue(null);
        Xrm.Page.getAttribute('new_fax2').setValue(null);

        Xrm.Page.getAttribute("new_contact_r1").setValue(null)
        Xrm.Page.getAttribute('new_phone').setValue(null);
        //Xrm.Page.getControl('new_contact_r1').setDisabled(false);//客户没值 联系人解锁
    }
    //#endregion

}

//联系人onchange事件
function contactOnChange(formContext) {
    debugger
    Xrm.Page.getAttribute('new_phone').setValue(null);
    //联系人是否存在
    let contact_options = Xrm.Page.getAttribute('new_contact_r1').getValue();
    //#region 通过客户ID查联系人
    //let account_options = Xrm.Page.getAttribute('new_account_r1').getValue();
    if (contact_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "";
        //if (account_options)
        //parameter = "new_contacts?$select=new_contactid,new_name,new_phone&$filter=_new_account_r1_value eq " + account_options[0].id;
        //if (contact_options)
        parameter = "new_contacts?$select=new_contactid,new_name,new_phone&$filter=new_contactid eq " + contact_options[0].id;

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
                        //为合同实体得客户信息赋值
                        // Xrm.Page.getAttribute('new_name').setValue([{ id: "{C54AA716-8DAA-EC11-9FB3-000C29E4ACF6}", name: "联系人1", entityType: "new_contact" }]);
                        //Xrm.Page.getAttribute("new_name").setValue([{ id: "{C54AA716-8DAA-EC11-9FB3-000C29E4ACF6}", name: "联系人1", entityType: "new_contacts" }]);
                        //var lup = new Array();
                        //lup[0] = new Object();
                        //lup[0].id = account_info.value[0].new_contactid;
                        //lup[0].name = account_info.value[0].new_name;
                        //lup[0].entityType = "new_contact";
                        //Xrm.Page.getAttribute("new_contact_r1").setValue(lup);

                        Xrm.Page.getAttribute('new_phone').setValue(account_info.value[0].new_phone);
                        //客户有值 联系人锁
                        //Xrm.Page.getControl("new_contact_r1").setDisabled(true);
                    }
                    else {
                        Xrm.Page.getAttribute("new_contact_r1").setValue(null)
                        Xrm.Page.getAttribute('new_phone').setValue(null);
                        //Xrm.Page.getControl("new_contact_r1").setDisabled(false);//客户没值 联系人解锁
                    }

                }
                else {
                    Xrm.Utility.alertDialog(this.statusText);
                }

            }
        };
        retrieveReq.send();
    }
    //#endregion
}

//联系人查找事件
function ContactAddFilter() {
    debugger
    var conditions = "";
    let account_options = Xrm.Page.getAttribute('new_account_r1').getValue();
    if (account_options) {
        conditions = account_options[0].id;
        let fetchXml = '<filter type="and"><condition attribute="new_account_r1" operator="eq"  value="' + conditions + '" /></filter>';
        Xrm.Page.getControl('new_contact_r1').addCustomFilter(fetchXml);
    }
}

//日期check
function dateCheck() {
    var new_startdate = Xrm.Page.getAttribute('new_startdate').getValue();
    var new_enddate = Xrm.Page.getAttribute('new_enddate').getValue();
    if (new_startdate > new_enddate) {
        Xrm.Utility.alertDialog("合同生效时间不允许晚于合同失效时间！");
        Xrm.Page.getAttribute('new_enddate').setValue("null");
    }

}

//提交
function submitOnClick() {
    debugger
    var go_next_step = true;
    let serviverUrl = Xrm.Page.context.getClientUrl();
    let parameter = "new_contractdetails?$select=new_name&$filter=new_price lt new_lowestprice and new_contract_r11/new_contractid eq " + Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');

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
                if (info.value.length > 0) {
                    go_next_step = false;
                    info.value.forEach(function (item) {
                        productNames += "【" + item.new_name + "】、";
                    })
                    Xrm.Utility.alertDialog(productNames + "单价不允许小于底价”，不允许提交");
                }
                else {
                    //单价无异常 
                    Xrm.Page.getAttribute('new_approvalstatus').setValue(20);
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

//审批通过
function approvedOnClick() {
    Xrm.Page.getAttribute('new_approvalstatus').setValue(30);
    Xrm.Page.data.save().then(function () { parent.window.location.reload(); });
}
//审批不通过
function ApprovalFailedOnClick() {
    Xrm.Page.getAttribute('new_approvalstatus').setValue(40);
    Xrm.Page.data.save().then(function () { parent.window.location.reload(); });
}

//页面禁用


//点击复制合同
function CopyContractOnClick() {
    debugger
    //var customer = {};
    //customer["new_contract_r1"] = Xrm.Page.data.entity.getId();        //给新实体的字段赋值
    //customer["new_contract_r1name"] = Xrm.Page.getAttribute("new_name").getValue();

    //customer["new_name"] = Xrm.Page.getAttribute("new_name").getValue();

    //if (Xrm.Page.getAttribute("new_account_r1").getValue() != null) {
    //    customer["new_account_r1"] = Xrm.Page.getAttribute("new_account_r1").getValue()[0].id;
    //    customer["new_account_r1name"] = Xrm.Page.getAttribute("new_account_r1").getValue()[0].name;
    //}
    //if (Xrm.Page.getAttribute("new_contact_r1").getValue() != null) {
    //    customer["new_contact_r1"] = Xrm.Page.getAttribute("new_contact_r1").getValue()[0].id;
    //    customer["new_contact_r1name"] = Xrm.Page.getAttribute("new_contact_r1").getValue()[0].name;
    //}

    //if (Xrm.Page.getAttribute("new_transactioncurrency_r1").getValue() != null) {
    //    customer["new_transactioncurrency_r1"] = Xrm.Page.getAttribute("new_transactioncurrency_r1").getValue()[0].id;
    //    customer["new_transactioncurrency_r1name"] = Xrm.Page.getAttribute("new_transactioncurrency_r1").getValue()[0].name;
    //}
    //if (Xrm.Page.getAttribute("new_province_r1").getValue() != null) {
    //    customer["new_province_r1"] = Xrm.Page.getAttribute("new_province_r1").getValue()[0].id;
    //    customer["new_province_r1name"] = Xrm.Page.getAttribute("new_province_r1").getValue()[0].name;
    //}

    //if (Xrm.Page.getAttribute("new_city_r1").getValue() != null) {
    //    customer["new_city_r1"] = Xrm.Page.getAttribute("new_city_r1").getValue()[0].id;
    //    customer["new_city_r1name"] = Xrm.Page.getAttribute("new_city_r1").getValue()[0].name;
    //}

    //customer["new_address"] = Xrm.Page.getAttribute("new_address").getValue();
    //customer["new_taxnumber"] = Xrm.Page.getAttribute("new_taxnumber").getValue();

    //customer["new_explanation"] = Xrm.Page.getAttribute("new_explanation").getValue();
    //customer["new_fax1"] = Xrm.Page.getAttribute("new_fax1").getValue();
    //customer["new_fax2"] = Xrm.Page.getAttribute("new_fax2").getValue();

    //customer["new_lowestamount1"] = Xrm.Page.getAttribute("new_lowestamount1").getValue() == null ? 0 : Xrm.Page.getAttribute("new_lowestamount1").getValue();
    //customer["new_lowestamount"] = Xrm.Page.getAttribute("new_lowestamount").getValue() == null ? "" : Xrm.Page.getAttribute("new_lowestamount").getValue() == null;
    //customer["new_phone"] = Xrm.Page.getAttribute("new_phone").getValue();
    //customer["new_postalcode"] = Xrm.Page.getAttribute("new_postalcode").getValue();
    //customer["new_rmbamount"] = Xrm.Page.getAttribute("new_rmbamount").getValue() == null ? "" : Xrm.Page.getAttribute("new_rmbamount").getValue();
    //customer["new_amount"] = Xrm.Page.getAttribute("new_amount").getValue() == null ? 0 : Xrm.Page.getAttribute("new_amount").getValue();

    //customer["new_startdate"] = Xrm.Page.getAttribute("new_startdate").getValue().toDateString();
    //customer["new_enddate"] = Xrm.Page.getAttribute("new_enddate").getValue().toDateString();

    ////打开创建的记录
    //Xrm.Utility.openEntityForm("new_contract", null, customer);





    //#region 后台action 实现复制
    debugger
    var ID = Xrm.Page.data.entity.getId().replace('{', '').replace('}', '');
    var entity = new Object();
    entity["actionName"] = 'workCopy';
    entity["input"] = ID;
    var req = new XMLHttpRequest()
    let serviverUrl = Xrm.Page.context.getClientUrl();
    req.open("post", serviverUrl + "/api/data/v9.1/" + "new_work_copy_contract_detail", false);
    req.setRequestHeader("Accept", "application/json");
    req.setRequestHeader("crossDomain", "true");
    req.setRequestHeader("Content-Type", "application/json; charset=utf-8");
    req.setRequestHeader("OData-MaxVersion", "4.0");
    req.setRequestHeader("OData-Version", "4.0");

    req.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                var result = JSON.parse(this.responseText);
                alert("复制成功");
                openNewRecords(result.output)
            }
            else {
                alert(this.responseText);
            }
        }
    };
    req.send(JSON.stringify(entity))
    //#endregion
}

//打开新窗口
function openNewRecords(fl_newrecord) {
    undefined
    //var fl_newrecord = Xrm.Page.getAttribute("new_nextplanguid"); //要打开实体的id
    var fl_writeinproductid2 = fl_newrecord;
    var windowOptions = {
        undefined,
        openInNewWindow: true
    };
    Xrm.Utility.openEntityForm("new_contract", fl_writeinproductid2, null, windowOptions);
    //if (fl_writeinproductid2 == "" || fl_writeinproductid2 == undefined) {
    //    undefined

    //}
    //else {
    //    undefined
    //    if (fl_writeinproductid2 != fl_newrecord && fl_newrecord != "") {
    //        undefined
    //        //fl_writeinproductid2 = fl_writeinproductid2[0].id.replace(/\{/, "").replace(/\}/, "");
    //        fl_newrecord.setSubmitMode("always");
    //        Xrm.Page.data.entity.save();
    //        var windowOptions = {
    //            undefined,
    //            openInNewWindow: true
    //        };
    //        Xrm.Utility.openEntityForm("new_communicationplan", fl_writeinproductid2, null, windowOptions);
    //    }
    //}
}


//市地区的查找内容 fetchxml
//市地区的查找内容 fetchxml
function cityAddFilter() {
    debugger
    var new_provinceid_control = Xrm.Page.getAttribute("new_province_r1").getValue();

    if (new_provinceid_control != null) {
        let fetchXml = '<filter type="and"><condition attribute="new_province_r1" operator="eq" value="' + new_provinceid_control[0].id + '" /></filter>';
        Xrm.Page.getControl('new_city_r1').addCustomFilter(fetchXml);

    }
}

//省 切换
function provinceOnChange(formContext, state) {
    debugger
    var new_provinceid_control = Xrm.Page.getAttribute("new_province_r1").getValue();
    if (state != 0) {
        Xrm.Page.getAttribute("new_city_r1").setValue(null)
    }
    if (new_provinceid_control != null) {//解锁
        Xrm.Page.getControl("new_city_r1").setDisabled(false);
    }
    else {
        Xrm.Page.getControl("new_city_r1").setDisabled(true);
    }

}
