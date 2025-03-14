sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",  
    "sap/m/MessageToast",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
], (Controller,JSONModel,MessageToast,Filter,FilterOperator) => {
    "use strict";

    return Controller.extend("sd17quais.controller.Quais", {
        onInit() {
            
            var oModel = this.getOwnerComponent().getModel('logModel');
            //oModel.setDefaultBindingMode("TwoWay");
             console.log(oModel.getDefaultBindingMode());
            this.getView().setModel(oModel);
            
            oModel.read("ZCDS_APP_QUAIS", {
                success: function (oData) {
                    console.log(oData);
                }.bind(this),
                error: function (oError) {
                    console.error("Failed to load data", oError);
                }
            });

            const oViewModel = new JSONModel({
                editMode: false
            });
            this.getView().setModel(oViewModel, "viewModel");

            var oPriorityModel = new JSONModel({
                priorities: [
                  { key: "0", text: " " },  
                  { key: "1", text: "1" },
                  { key: "2", text: "2" },
                  { key: "3", text: "3" },
                  { key: "4", text: "4" }
                ]
              });
              this.getView().setModel(oPriorityModel, "priorityModel");
        },

    onEditPress() { 
        this.getView().getModel("viewModel").setProperty("/editMode", true);
    },

    onSavePress() { 
        //this.getView().getModel("viewModel").setProperty("/editMode", false);

        var oModel = this.getView().getModel('logModel');
        var oTable = this.byId("table");
        var aContexts = oTable.getBinding("rows").getContexts();
        
        aContexts.forEach(function(oContext) {
            var oData = oContext.getObject();
            
            // Ici, vous pouvez ajouter une logique de détection des changements.
            // Par exemple, si vous aviez stocké les valeurs d'origine dans un autre modèle,
            // vous pourriez comparer oData.Quai1, oData.Quai2, etc.
            // Pour l'exemple, nous mettons à jour toutes les lignes.
            
            var sPath = oContext.getPath(); // Doit contenir la clé, par exemple "/ZCDS_APP_QUAIS('CODEARTICLE')"
            console.log(sPath);
            // Préparer le payload en convertissant les valeurs en entier (Edm.Byte)
            var oPayload = {
            Quai1: parseInt(oData.Quai1, 10),
            Quai2: parseInt(oData.Quai2, 10),
            Quai3: parseInt(oData.Quai3, 10),
            Quai4: parseInt(oData.Quai4, 10)
            };
            
            oModel.update(sPath, oPayload, {
            success: function() {
                console.log("Ligne mise à jour : " + sPath);
            },
            error: function(oError) {
                console.error("Erreur de mise à jour pour " + sPath, oError);
            }
            });
        });
        
        sap.m.MessageToast.show("Les mises à jour ont été envoyées.");
        
        // Par exemple, on repasse en mode affichage une fois l'opération terminée
        this.getView().getModel("viewModel").setProperty("/editMode", false);

    },

    onCancelPress() { 
        var oModel = this.getView().getModel();
        oModel.resetChanges();

        this.getView().getModel("viewModel").setProperty("/editMode", false);
    },

    onQuaiChange(oEvent) {
        const oSelect = oEvent.getSource();
        const sSelectedKey = oSelect.getSelectedKey(); // Valeur choisie
        const oContext = oSelect.getBindingContext();  // BindingContext => la ligne du tableau
        const sPath = oContext.getPath();              // ex "/0", "/1", ...
        const oData = this.getView().getModel().getProperty(sPath);
        // Identifier quelle propriété a changé (Quai1, Quai2, ...)
        // On lit le binding info du select
        const sProperty = oSelect.getBindingInfo("selectedKey").binding.sPath; 
        // => par ex. "Quai1", "Quai2", etc.
  
        // Vérifier l'unicité parmi les autres quais
        const aQuais = ["Quai1", "Quai2", "Quai3", "Quai4"];
        const bAlreadyUsed = aQuais.some(q => {
          return q !== sProperty && oData[q] == sSelectedKey; 
        });
  
        if (bAlreadyUsed) {
          // Valeur déjà utilisée sur un autre quai => message et on annule
          MessageToast.show(`La priorité ${sSelectedKey} est déjà occupée.`);
          // Revenir à l’ancienne valeur
          oSelect.setSelectedKey(oData[sProperty]);
        } else {
          // Mettre à jour la propriété dans le modèle
          this.getView().getModel().setProperty(sPath + "/" + sProperty, sSelectedKey);
        }
      },

      onValueHelpRequest: function (oEvent) {
        var sInputId = oEvent.getSource().getId();
        
        //  Code Article 
        if (sInputId.indexOf("filtreCodeArticle") !== -1) {
            if (!this._oProductVHDialog) {
                this._oProductVHDialog = sap.ui.xmlfragment("sd17quais.fragments.ProductVHDialog", this);
                this.getView().addDependent(this._oProductVHDialog);
                var oTable = sap.ui.getCore().byId("productVHTable");
                var oModel = this.getView().getModel("logModel");
                oTable.setModel(oModel);
                var oTemplate = new sap.m.ColumnListItem({
                    type: "Active",
                    cells: [
                        new sap.m.Text({ text: "{Product}" })
                    ]
                });
                oTable.bindItems({
                    path: "/ZCDS_PRODUCT_VH", 
                    template: oTemplate
                });
            }
            this._oProductVHDialog.open();
        
        //  Division 
        } else if (sInputId.indexOf("filtreDivision") !== -1) {
            if (!this._oPlantVHDialog) {
                this._oPlantVHDialog = sap.ui.xmlfragment("sd17quais.fragments.PlantVHDialog", this);
                this.getView().addDependent(this._oPlantVHDialog);
                var oTable = sap.ui.getCore().byId("plantVHTable");
                var oModel = this.getView().getModel("logModel");
                oTable.setModel(oModel);
                var oTemplate = new sap.m.ColumnListItem({
                    type: "Active",
                    cells: [
                        new sap.m.Text({ text: "{Plant}" }),
                        new sap.m.Text({ text: "{PlantName}" })
                    ]
                });
                oTable.bindItems({
                    path: "/ZCSD_PLANT_VH", 
                    template: oTemplate
                });
            }
            this._oPlantVHDialog.open();
        
        // Magasin
        } else if (sInputId.indexOf("filtreMagasin") !== -1) {
            if (!this._oMagasinVHDialog) {
                this._oMagasinVHDialog = sap.ui.xmlfragment("sd17quais.fragments.MagasinVHDialog", this);
                this.getView().addDependent(this._oMagasinVHDialog);
                var oTable = sap.ui.getCore().byId("magasinVHTable");
                var oModel = this.getView().getModel("logModel");
                oTable.setModel(oModel);
                var oTemplate = new sap.m.ColumnListItem({
                    type: "Active",
                    cells: [
                        new sap.m.Text({ text: "{StorageLocation}" }),
                        new sap.m.Text({ text: "{StorageLocationName}" })
                    ]
                });
                oTable.bindItems({
                    path: "/ZCDS_MAGASIN_VH", 
                    template: oTemplate
                });
            }
            this._oMagasinVHDialog.open();
        }
    },


    /* Get Value Slected from the fragement  */
    onProductVHSelect: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) { return; }
        var sValue = oSelectedItem.getCells()[0].getText();
        this.byId("filtreCodeArticle").setValue(sValue);
        this._oProductVHDialog.close();
    },

    onPlantVHSelect: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) { return; }
        var sValue = oSelectedItem.getCells()[0].getText();
        this.byId("filtreDivision").setValue(sValue);
        this._oPlantVHDialog.close();
    },

    onMagasinVHSelect: function (oEvent) {
        var oSelectedItem = oEvent.getParameter("listItem");
        if (!oSelectedItem) { return; }
        var sValue = oSelectedItem.getCells()[0].getText();
        this.byId("filtreMagasin").setValue(sValue);
        this._oMagasinVHDialog.close();
    },
    /* Close  */
    onCloseValueHelp: function (oEvent) {
        var oDialog = oEvent.getSource().getParent();
        oDialog.close();
    },

    onSearch: function (oEvent) {
        var sCodeArticle = this.byId("filtreCodeArticle").getValue();
        var sDivision    = this.byId("filtreDivision").getValue();
        var sMagasin     = this.byId("filtreMagasin").getValue();

        
        var aFilters = [];

        if (sCodeArticle && sCodeArticle.trim() !== "") {
            aFilters.push(new Filter("code_article", FilterOperator.Contains, sCodeArticle));
        }
        if (sDivision && sDivision.trim() !== "") {
            aFilters.push(new Filter("Division", FilterOperator.Contains, sDivision));
        }
        if (sMagasin && sMagasin.trim() !== "") {
            aFilters.push(new Filter("Magasin", FilterOperator.Contains, sMagasin));
        }

        
        var oTable = this.byId("table");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters);
    },

    onSearch: function (oEvent) {
        
        var sCodeArticle = this.byId("filtreCodeArticle").getValue();
        var sDivision    = this.byId("filtreDivision").getValue();
        var sMagasin     = this.byId("filtreMagasin").getValue();

        
        var aFilters = [];

        if (sCodeArticle && sCodeArticle.trim() !== "") {
            aFilters.push(new Filter("code_article", FilterOperator.Contains, sCodeArticle));
        }
        if (sDivision && sDivision.trim() !== "") {
            aFilters.push(new Filter("Division", FilterOperator.Contains, sDivision));
        }
        if (sMagasin && sMagasin.trim() !== "") {
            aFilters.push(new Filter("Magasin", FilterOperator.Contains, sMagasin));
        }

        
        var oTable = this.byId("table");
        var oBinding = oTable.getBinding("rows");
        oBinding.filter(aFilters);
    }
    
});
});