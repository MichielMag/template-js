'use strict';

class Data {
    constructor(){

    }
}

class RENDERERBASE {
    constructor() {
        this.forbidden = [
            "forbidden",
            "properties",
            "object_old",
            "object"
        ];
    }

    S4() {
        return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
    }
    get NewGuid() {
        return (this.S4() + this.S4() + "-" + this.S4() + "-4" + this.S4().substr(0,3) + "-" + this.S4() + "-" + this.S4() + this.S4() + this.S4()).toLowerCase();
    }
}

class Property {
    constructor(name, value) {
        this.name = name;
        this.value = value;
        this.old = value;
        this.dom = [];
    }

    commit() {
        this.old = this.value;
    }

    cancel() {
        this.value = this.old;
    }
}

class Renderer extends RENDERERBASE {
    constructor(obj) {
        super();
        // Make a base object to store all properties in
        this.data = new Data();

        // Fill that base object with all the data 
        for(var prop in obj) {
            this.data[prop] = new Property(prop, obj[prop]);
        }

        if(this.data["id"] == undefined) {
            this.data["id"] = new Property("id", this.NewGuid);
        }

        // render html based on a template if found
        this._html = this.render();

    }

    render() {

        // First look for a template in the HTML
        // TODO: Make this configureable?
        var identifier = this.constructor.name + "-template";
        var template = document.getElementById(identifier);

        // If it can't be found, put an error on screen and return an empty string.
        if(template == undefined || template == null) {
            console.error("No template found for " + this.constructor.name);
            return "";
        }

        // Clone it so that it can be used multiple times
        template = template.cloneNode(true);

        // Remove the id, since that is unique, and add a unique ID
        // TODO: Do we want to force an object to have an id?
        template.removeAttribute("id");
        template.setAttribute("id", this.name + "-" + this.data.id.value);
        template.classList.remove("template");
        template.classList.add("generated-object");

        this.renderProperties(template);

        return template;
    }

    renderProperties(html) {
        for(var prop in this.data) {

            // We're going to fill the template by looking for classes.
            // We want every html node to be filled with it. This way you can 
            // fill both input elements and textual elements for example.
            var fields = html.getElementsByClassName(this.data[prop].name);

            // No fields were found
            if( fields.length <= 0) {
                console.warn("No fields found for " + this.constructor.name + ".data." + prop);
                return;
            }

            // Attach the dom to the property
            this.data[prop].dom = fields;

            // Gives the type name. This can be something like "Number", "String", 
            // but also "Array" or some custom defind class.
            var data_type = this.data[prop].value.constructor.name;

            console.log(data_type);
            
            // We have to use [].forEach.call because NodeList doesn't have 
            // forEach() implemented, and we don't want to touch the prototype
            [].forEach.call(
                fields, // Foreaching the fields with class of data property
                function(domObj, elementType) { 
                    // If the element we want to put the data in is an input
                    if(elementType == "HTMLInputElement") {
                        // If it's a number input, ofcourse strings cannot be used as values
                        if(elementType.type == "number") {
                            if(data_type != "Number") {
                                throw Error("Cannot fillin the data of " + data_type + "in a number input.");
                            } else {
                                elementType.value = this.data[prop].value;
                            }
                        } else if (data_type != "String" && data_type != "Number") {
                            // So, we can only put numbers or strings in any input, no objects, no arrays
                            // TODO: Detect if it's a Select maybe?
                            throw Error("Cannot fillin the data of " + data_type + "in an input.");
                        } else {
                            // So it's an input that accepts text, just put it in, be it a number or string
                            domObj.appendChild(this.data[prop].value);
                        }
                    } else {
                        // For all other elements than input, we can just enter the value, but:
                        // If it's an array, we're going to either add it as an object, or append it to a string?
                        if(data_type == "Array") {
                            this.data[prop].value.forEach( function(e) {
                                if(e instanceof Renderer) {
                                    domObj.appendChild(e.html);
                                } else {
                                    domObj.appendChild(document.createTextNode(e));
                                }
                            });
                        } else if(data_type == "String" || data_type == "Number") {
                            // If it's text or a number we can just fill in with text
                            domObj.appendChild(document.createTextNode(this.data[prop].value));
                        } else {
                            // And if it's an object, let's see if we can ask for its html (if it's a renderer)
                            if(this.data[prop].value instanceof Renderer) {
                                domObj.appendChild(this.data[prop].value.html);
                            } else {
                                console.warn("Trying to render a non-renderer object, skipping");
                            }                            
                        }
                    }
                },
                this
            );
        }
    }

    properties() {
        for(var prop in this)
            console.log(prop);
    }

    get name() {
        return this.constructor.name;
    }

    get html() {
        return this._html;
    }
    set html(val) {
        this._html = val;
    }
}

var paragraphs = [
    {

        content: "lorem ipsum blablabla",
        font: "asd"
    },
    {

        content: "Nog een lorem blablabla",
        font: "asd2"
    }
]

var page = {
    id: "asd-1234-qwe",
    number: 0,
    float: 0.15,
    char: 'a',
    title: "Page Title",
    paragraphs: paragraphs
};

class Paragraph extends Renderer { }

class Page extends Renderer {
    constructor(obj) {
        var pars = [];
        obj.paragraphs.forEach( function(p) {
            pars.push(new Paragraph(p));
        });
        obj.paragraphs = pars;
        super(obj);
    }
}

var p = new Page(page);


document.getElementById("page").appendChild(p.html);