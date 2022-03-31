/*
* @Author: tmh
* @Date: 2022-3-24 16:16:53
* @LastEditors: Andy
* @LastEditTime: 2022-3-31 10:22:30
* @FilePath: \JavaScript\contactdetail.js
* @Description: 合同明细操作
* @copyright: Copyright (c) ${now_year} by Andy/汉得微扬, All Rights Reserved.
*/

/**
 * @description 页面加载事件函数: 
 * @param {*} executionContext  窗体上下文对象
 * @return {*} void
 */
function FormOnload(executionContext) {
    var UserId = Xrm.Page.context.getUserId();       //获取当前用户id
    var UserName = Xrm.Page.context.getUserName();       //获取当前用户的用户名
    var UserRoles = Xrm.Page.context.getUserRoles();       //获取当用户的安全角色

    CheckStatus();

    debugger
    //可见性：只有关联客户的负责人 = 当前用户 &用户安全角色=业务员&已保存的记录&状态=（草稿或审批拒绝）
    let formContext = executionContext.getFormContext();
    debugger
    //【合同明细编号】、【牌号】、【产品描述】、【等级】、【底价】、【单价总金额】、【底价总金额】
    formContext.getControl('new_number').setDisabled(true);
    formContext.getControl('new_productbrand').setDisabled(true);
    formContext.getControl('new_productdescription').setDisabled(true);
    formContext.getControl('new_level').setDisabled(true);

    formContext.getControl('new_lowestprice').setDisabled(true);
    formContext.getControl('new_totolprice').setDisabled(true);
    formContext.getControl('new_totollowestprice').setDisabled(true);

    if (Xrm.Page.ui.getFormType() == 1) {//新增状态
    }
    var new_contractdetailid_control = formContext.getControl('new_contractdetailid');


    //注册产品onchange事件
    Xrm.Page.getControl('new_product_r11').getAttribute().addOnChange(function () {
        productOnChange(formContext);
    });


    //注册单价事件
    Xrm.Page.getControl('new_price').getAttribute().addOnChange(function () {
        calculate(formContext);
    });

    //注册数量事件
    Xrm.Page.getControl('new_quantity').getAttribute().addOnChange(function () {
        calculate(formContext);
    });


    //注册底价事件
    Xrm.Page.getControl('new_lowestprice').getAttribute().addOnChange(function () {
        calculate(formContext);
    });

}

//单价onchange事件
function calculate(formContext) {
    debugger
    var new_price = formContext.getAttribute('new_price').getValue() == null ? 0 : formContext.getAttribute('new_price').getValue();
    var new_lowestprice = formContext.getAttribute('new_lowestprice').getValue() == null ? 0 : formContext.getAttribute('new_lowestprice').getValue();

    var new_quantity = formContext.getAttribute('new_quantity').getValue() == null ? 0 : formContext.getAttribute('new_quantity').getValue();

    formContext.getAttribute('new_totolprice').setValue(parseFloat(new_price) * parseFloat(new_quantity));
    formContext.getAttribute('new_totollowestprice').setValue(parseFloat(new_lowestprice) * parseFloat(new_quantity));


}

//保存save
function FormOnSave() {


}


//产品更改事件函数
function productOnChange(formContext) {
    //#region 查产品信息
    debugger
    let product_options = Xrm.Page.getAttribute('new_product_r11').getValue();
    if (product_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_products?$select=new_productbrand,new_productdescription,new_level,new_price&$filter=new_productid eq " + product_options[0].id;

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
                        //为合同明细实体得产品信息赋值
                        Xrm.Page.getAttribute('new_productbrand').setValue(product_info.value[0].new_productbrand);
                        Xrm.Page.getAttribute('new_productdescription').setValue(product_info.value[0].new_productdescription);
                        Xrm.Page.getAttribute('new_level').setValue(product_info.value[0].new_level);
                        Xrm.Page.getAttribute('new_lowestprice').setValue(product_info.value[0].new_price);
                        calculate(formContext);
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
        Xrm.Page.getAttribute('new_number').setValue(null);
        Xrm.Page.getAttribute('new_productbrand').setValue(null);
        Xrm.Page.getAttribute('new_productdescription').setValue(null);
        Xrm.Page.getAttribute('new_level').setValue(null);
        Xrm.Page.getAttribute('new_lowestprice').setValue(null);
        calculate(formContext);
    }

    //#endregion

}


//检查页面状态实现只读
function CheckStatus() {
    debugger
    let contract_options = Xrm.Page.getAttribute('new_contract_r11').getValue();
    if (contract_options) {
        let serviverUrl = Xrm.Page.context.getClientUrl();
        let parameter = "new_contracts?$select=new_approvalstatus&$filter=new_contractid eq " + contract_options[0].id;

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
                        if (contract_info.value[0].new_approvalstatus != 10 && contract_info.value[0].new_approvalstatus != 40) {
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
    };




}


//页面禁用
function disabledControls() {
    Xrm.Page.ui.controls.forEach(function (item, index) {
        item.setDisabled(true);
    });
}