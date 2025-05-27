import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { loadScript }  from 'lightning/platformResourceLoader';
import apexTree from "@salesforce/resourceUrl/apextree";
import getData from "@salesforce/apex/RelationshipMapController.getData";

export default class RelationshipMap extends NavigationMixin(LightningElement) {
    static renderMode = "light";
    apexTreeInitializaed = false;

	@api recordId;
	@api relationshipMapConfigurationName;

	data;
	_recordDetailUrl;

	connectedCallback() {
		this[NavigationMixin.GenerateUrl]({
			type: 'standard__recordPage',
			attributes: {
				recordId: this.recordId,
				actionName: 'view'
			}
		}).then(url => {
			this._recordDetailUrl = url;
		});
	}

    renderedCallback() {
		if(!this.apexTreeInitializaed) { 
			this.apexTreeInitializaed = true;
			loadScript(this, apexTree)
				.then(() => {
					this.initializeMap();
				})
				.catch((error) => {
					console.error('Error loading ApexTree library', error);
				});
		}
	}

    initializeMap() {
		let params = {
			relationshipMapConfigurationName: this.relationshipMapConfigurationName, 
			recordId: this.recordId
		};

		getData(params)
			.then((result) => {
				this.data = result;
				this.renderTree();
			})
			.catch((error) => {
				console.log(error);
			})
	}

	renderTree() {
		let options = {
            contentKey: 'data',
			height: 600,
			nodeWidth: 500,
			nodeHeight: 260,
			fontColor: '#fff',
			borderColor: '#333',
			childrenSpacing: 100,
			siblingSpacing: 80,
			edgeColorHover: '#1b96ff',
			borderColorHover: '#1b96ff',
			borderWidth: 2,
			highlightOnHover: true,
			direction: 'top',
			canvasStyle: 'width: -webkit-fill-available',
			enableToolbar: true,
			enableExpandCollapse: true,
        };

		options.nodeTemplate = (data) => {
			let stubContainer = document.createElement("div");
			let container = document.createElement("div");
			container.classList.add("clickable", "node-container");
			container.style.display = "flex";
			container.style.color = "black";
			container.style.flexDirection = "column";
			container.style.gap = "0.25rem";
			container.style.alignItems = "stretch";
			container.style.fontSize = "1rem";
			container.style.cursor = "pointer";
			container.style.height = "100%";
			container.style.overflow = "auto";

			if (data.nodeObjectName.objectName == 'RelationshipMapNodeGroup__c') {
				container.appendChild(this.getNodeGroup(data));
			} else {
				container.appendChild(this.getNodeHeader(data));
				this.setNodeFields(container, data);
			}

			stubContainer.appendChild(container);
			return stubContainer.innerHTML;
		}

        var tree = new ApexTree(this.refs.tree, options);
        tree.render(this.data);
		this.changeDOM();
	}

	getNodeGroup(data) {
		let rowContainer = document.createElement("div");
		rowContainer.classList.add("row-container");
		rowContainer.style.display = "flex";
		rowContainer.style.justifyContent = "center";
		rowContainer.style.alignItems = "center";
		rowContainer.style.fontSize = "1.5rem";
		rowContainer.style.fontWeight = "bold";
		rowContainer.style.height = "100%";
		rowContainer.style.padding = "0.75rem";
		rowContainer.style.background = data.Color__c ? data.Color__c.value : "var(--lwc-colorBackground)";

		let fieldValueContainer = document.createElement("div");
		fieldValueContainer.innerText = data.Name.value;
		fieldValueContainer.title = data.Name.value;
		fieldValueContainer.style.textAlign = "center";

		rowContainer.appendChild(fieldValueContainer);
		return rowContainer;
	}

	getNodeHeader(data) {
		let headerRowConiner = document.createElement("div");
		headerRowConiner.style.display = "flex";
		headerRowConiner.style.flexDirection = "row";
		headerRowConiner.style.flexWrap = "nowrap";
		headerRowConiner.style.alignContent = "center";
		headerRowConiner.style.justifyContent = "flex-start";
		headerRowConiner.style.alignItems = "center";
		headerRowConiner.style.gap = "1rem";
		headerRowConiner.style.padding = "0.75rem";
		headerRowConiner.style.position = "sticky";
		headerRowConiner.style.top = "0";
		headerRowConiner.style.background = "white";
		
		let iconContainer = document.createElement("div");
		
		let icon = document.createElement("img");
		icon.src = data.nodeObjectIcon.iconUrl;
		icon.style.backgroundColor = `#${data.nodeObjectIcon.iconColor}`;
		icon.style.width = "2rem";
		icon.style.borderRadius = "0.25rem";
		iconContainer.appendChild(icon);

		let objectNameContainer = document.createElement("div");
		objectNameContainer.classList.add("slds-truncate");		

		let objectNameLink = document.createElement("a");
		objectNameLink.setAttribute('href', this.getRecordDetailUrl(data.Id.value));
		objectNameLink.innerText = data.hasOwnProperty("Name") 
			? `${data.nodeObjectName.objectLabel}: ${data.Name.value}`
			: data.nodeObjectName.objectLabel;
		objectNameLink.style.fontWeight = "bold";
		objectNameContainer.setAttribute('title', objectNameLink.innerText);
		
		let actionsCotainer = document.createElement("div");
		actionsCotainer.style.marginLeft = "auto";

		headerRowConiner.appendChild(iconContainer);
		objectNameContainer.appendChild(objectNameLink);
		headerRowConiner.appendChild(objectNameContainer);
		headerRowConiner.appendChild(actionsCotainer);

		return headerRowConiner;
	}

	setNodeFields(container, data) {
		for (const [key, value] of Object.entries(data)) {
			if (key != 'nodeObjectName' && key != 'nodeObjectIcon') {
				if (value.hasOwnProperty("Id")) {
					for (const [innerKey, innerValue] of Object.entries(value)) {
						if (innerKey != 'nodeObjectName' && innerKey != 'nodeObjectIcon') {
							let fieldRow = this.getFieldRow(innerKey, innerValue);
							let fieldContainer = fieldRow.querySelector('.field-name-container');
							let innerText = fieldContainer.innerText;
							fieldContainer.innerText = `${key}.${innerText}`;

							container.appendChild(fieldRow);
						}
					}
				} else {
					container.appendChild(this.getFieldRow(key, value));
				}
			}
		}
	}

	getFieldRow(key, value) {
		let rowContainer = document.createElement("div");
		rowContainer.classList.add("row-container");
		rowContainer.style.display = "flex";
		rowContainer.style.flexDirection = "row";
		rowContainer.style.alignItems = "center";
		rowContainer.style.paddingLeft = "0.75rem";
		rowContainer.style.paddingRight = "0.75rem";
		rowContainer.style.paddingTop = "0.325rem";
		rowContainer.style.paddingBottom = "0.325rem";
	
		let fieldNameContainer = document.createElement("label");
		fieldNameContainer.innerText = `${value.label}:`;
		fieldNameContainer.title = `${value.label}:`;
		fieldNameContainer.classList.add("slds-truncate", "field-name-container");
		fieldNameContainer.style.width = "50%";
		
		let fieldValueContainer = document.createElement("div");
		fieldValueContainer.style.width = "50%";
		fieldValueContainer.classList.add("slds-truncate");
		fieldValueContainer.innerText = value.value;
		fieldValueContainer.title = value.value;
		
		if (value.type == "ID" || value.type == "REFERENCE") {
			rowContainer.style.display = "none";
		}

		rowContainer.appendChild(fieldNameContainer);
		rowContainer.appendChild(fieldValueContainer);
		
		return rowContainer;
	}

	changeDOM() {
		this.querySelector("#toolbar > #export").style.display = "none";
	}

	getRecordDetailUrl(targetRecordId) {
		let regex = this.recordId;
		return this._recordDetailUrl.replace(regex, targetRecordId);
	}
}