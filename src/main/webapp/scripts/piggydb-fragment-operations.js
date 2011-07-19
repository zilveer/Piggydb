//
// Initialization
//
jQuery(function() {
  FragmentForm.init();
  Fragment.init();
  QuickEdit.init();
  
  // auto-complete
  jQuery("input[name=tags]").autocomplete(constants["autocomplete-url"], {
    minChars: 1,
    selectFirst: true,
    multiple: true,
    multipleSeparator: ', ',
    scrollHeight: 300
  });
  jQuery("input.single-tag").autocomplete(constants["autocomplete-url"], {
    minChars: 1,
    selectFirst: true,
    multiple: false,
    scrollHeight: 300
  });
});



//
// Fragment Form
//
var FragmentForm = {
	init: function() {
		jQuery('.content-type-switch input').click(FragmentForm.onContentTypeSwitch);
	  jQuery("textarea.fragment-content").markItUp(FragmentForm.markItUpSettings);
	  jQuery(".markItUp .markItUpButton9 a").attr("href", constants["wiki-help-href"])
	  	.click(FragmentForm.onWikiHelpClick);
	  jQuery("input[name=preview]").click(function () {
	    this.form.contentFieldHeight.value = jQuery(this.form.content).height();
	  });
	  jQuery(".fragment-form-panel input[name=register]").click(function () {
	    var panel = jQuery(this).closest(".fragment-form-panel");
	    panel.find(".fragment-form-toggle").putLoadingIcon("margin-left: 5px; vertical-align: middle;");
	    panel.find(".toggle-icon").attr("src", "images/twistie-up.gif");
	    panel.find(".fragment-form-div").hide();
	  });
	},
		
  onToggleClick: function(panelName) {
		var formDiv = document.getElementById(panelName + "-div");
		var toggleIcon = document.getElementById(panelName + "-toggle-icon");
		if (formDiv.style.display == "none") {
		  toggleIcon.src = "images/twistie-down.gif";
		  formDiv.style.display = "block";
		} 
		else {
		  toggleIcon.src = "images/twistie-up.gif";
		  formDiv.style.display = "none";
		}
  },
  
  onContentTypeSwitch: function() {
    var formId = jQuery(this.form).attr("id");
    var newValue = this.value;
    var oldValue = this.form.contentType.value;
    if (newValue == oldValue) {
      return;
    }
    jQuery('#' + formId + ' .for-' + oldValue).hide();
    jQuery('#' + formId + ' .for-' + newValue).show();
    this.form.contentType.value = newValue;
  },
  
  onWikiHelpClick: function() {
    wikiHelp.show(this.href);
    return false;
  },
  
  markItUpSettings: {
    previewAutoRefresh: false,
    previewParserPath:  '', // path to your Wiki parser
    onShiftEnter:   {keepDefault:false, replaceWith:'\n\n'},
    markupSet: [
      {name: messages["editor-bold"], key: 'B', openWith: "'''", closeWith: "'''"}, 
      {name: messages["editor-italic"], key: 'I', openWith: "''", closeWith: "''"}, 
      {name: messages["editor-strike"], key: 'S', openWith: '__', closeWith: '__'}, 
      {separator: '---------------' },
      {name: messages["editor-bulleted-list"], openWith: '-'}, 
      {name: messages["editor-numeric-list"], openWith: '+'}, 
      {separator: '---------------' },
      {name: messages["editor-link"], key: "L", openWith: "[[![URL:!:http://]!] ", 
        closeWith: ']', placeHolder: messages["editor-link-label"] },
      {name: messages["editor-embed-another-fragment"], key: 'E',
        openWith: "fragment:[![" + messages["editor-fragment-id"] + "]!]:embed "},
      {separator: '---------------' },
      {name: messages["editor-quote"], openWith: '>', placeHolder: ''},
      {separator: '---------------' },
      {name: messages["help"]}
    ]
  }
};



//
// Fragment 
//
function Fragment(node) {
	this.node = jQuery(node);
	this.root = this.node.closest("table.fragment");
}
Fragment.init = function() {
	jQuery("table.fragment").live('mouseenter', function() {
    jQuery(this).find(".fragment-tools").eq(0).show();
  });
  jQuery("table.fragment").live('mouseleave', function() {
    jQuery(this).find(".fragment-tools").eq(0).hide();
  });
  jQuery("a.img-link").live("click", onImageClick);
  makeFragmentsDroppable("table.fragment", null);
  makeSelectedFragmentsDroppable();
  makeRelationsDraggable("");
};
Fragment.findInTheSameFragmentNode = function(node, selector) {
	return jQuery(node).closest("table.fragment-node").find(selector);
};
Fragment.prototype = {
	id: function() {
		return this.root.find("span.fragment-id:first").text();
	},
	
	header: function() {
		return this.root.find("div.fragment-header:first");
	},
	
	headerRow: function() {
		return this.header().closest("tr");
	},
	
	bodyRow: function() {
		return this.headerRow().siblings("tr.fragment-body");
	},
	
	setBodyRow: function(rowHtml) {
		this.bodyRow().remove();
		this.headerRow().after(rowHtml);
	},
	
	textContentDiv: function() {
		return this.bodyRow().find("div.fragment-content-text");
	},
	
	isMultirow: function() {
		return this.root.hasClass("multirow");
	},
	
	isMain: function() {
		return this.root.hasClass("fragment-main");
	},
	
	contentToggle: function() {
		var toggle = this.header().find(".fragment-content-toggle a.tool-button");
		return toggle.size() == 0 ? null : new ContentToggle(toggle);
	}
};



//
// Quick Edit
//
var QuickEdit = {
	init: function() {
	  jQuery("div.fragment-content-text").live('dblclick', function() {
		  var contentDiv = jQuery(this);
		  QuickEdit.openEditor(new Fragment(contentDiv).id(), contentDiv);
		});
	},
	
	onEditButtonClick: function(button) {
		var fragment = new Fragment(button);
		
		// fragment page
		if (fragment.isMain()) {
			jQuery("#fragmentFormPanel a.toggle-link").click();
			return true;
		}
		
		// content opened
		var contentDiv = fragment.textContentDiv();	
		if (contentDiv.size() == 1) {
			QuickEdit.openEditor(fragment.id(), contentDiv);
			return true;
		}
		
		// content hidden or empty on a multirow fragment table
		if (fragment.isMultirow()) {
			var contentToggle = fragment.contentToggle();
			if (contentToggle != null) contentToggle.setOpened();
			
			var emptyBodyRow = jQuery("#tpl-fragment-body-row-with-empty-text tbody").html().trim();
			fragment.setBodyRow(emptyBodyRow);
			QuickEdit.openEditor(fragment.id(), fragment.textContentDiv());
			return true;
		}	
		return false;
	},
	
	openEditor: function(id, contentDiv) {
		var contentDivHeight = contentDiv.height();
	  var editorDiv = contentDiv.siblings("div.fragment-content-editor");
	  contentDiv.empty().putLoadingIcon(); 
	  jQuery.get("html/fragment-content-editor.htm", {"id" : id}, function(html) {
	  	contentDiv.empty();
	  	editorDiv.html(html);
		
	  	var editor = editorDiv.find("textarea.fragment-content");
	  	editor.markItUp(FragmentForm.markItUpSettings);
	  	editorDiv.find(".markItUp .markItUpButton9 a")
		  	.attr("href", constants["wiki-help-href"]).click(FragmentForm.onWikiHelpClick);
		
	  	var height = Math.max(contentDivHeight, editor.height());
	  	editor.height(Math.min(height, 500));
	  });
	},

	onCancel: function(button) {
		var fragment = new Fragment(button);
		var editorDiv = jQuery(button).closest("div.fragment-content-editor");	
		var contentDiv = editorDiv.siblings("div.fragment-content-text");
		
		editorDiv.empty();
		contentDiv.empty().putLoadingIcon();
		jQuery.get("html/fragment-body-row.htm", {"id": fragment.id()}, function(html) {
			if (isNotBlank(html)) {
				var content = jQuery(html).find("div.fragment-content").html();
				contentDiv.html(content);
				prettyPrint();
			}
			else {
				QuickEdit.emptyContent(contentDiv);
			}
		});
	},
	
	emptyContent: function(contentDiv) {
		Fragment.findInTheSameFragmentNode(contentDiv, "span.fragment-content-toggle:first").remove();
  	contentDiv.closest("tr.fragment-body").remove();
	},

	onUpdate: function(button) {
		var fragment = new Fragment(button);
		var editorDiv = jQuery(button).closest("div.fragment-content-editor");
		var content = editorDiv.find("textarea").val();
		var contentDiv = editorDiv.siblings("div.fragment-content-text");
		
		editorDiv.empty();
		contentDiv.empty().putLoadingIcon();
		var params = {"id": fragment.id(), "content": content};
		jQuery.post("html/update-fragment-content.htm", params, function(html) {
		  if (isNotBlank(html)) {
		  	contentDiv.html(html);
		  	prettyPrint();
		  }
		  else {
		  	QuickEdit.emptyContent(contentDiv);
		  } 
		});
	}
};



//
// Liquid Blocks
//
function liquidBlocks(selectorPrefix, blockWidth, containerWidth) {
  var blocksSelector = selectorPrefix + "ul.liquid-blocks";

  // Get the width of row
  if (containerWidth == null) {
    // Reset the container size to a 100% once view port has been adjusted
    jQuery(blocksSelector).css({ 'width' : "100%" });
    containerWidth = jQuery(blocksSelector).width();
  }

  // Find how many blocks can fit per row
  // then round it down to a whole number
  var colNum = Math.floor(containerWidth / blockWidth);
  if (colNum == 0) colNum = 1;

  // Get the width of the row and divide it by the number of blocks it can fit
  // then round it down to a whole number.
  // This value will be the exact width of the re-adjusted block
  var colFixed = Math.floor(containerWidth / colNum);

  // Set exact width of row in pixels instead of using %
  // Prevents cross-browser bugs that appear in certain view port resolutions.
  jQuery(blocksSelector).css({ 'width' : containerWidth });

  // Set exact width of the re-adjusted block
  jQuery(blocksSelector + " li.liquid-block").css({ 'width' : colFixed });
}



//
// Fragment Operations
//

function onShowHiddenTags(button) {
  jQuery(button).siblings(".hidden-tags").show();
  jQuery(button).hide();
}

function onImageClick() {
  imageViewer.showImage(this.href);
  return false;
}

function onDeleteTagClick(tagName, form) {
  form.tagToDelete.value = tagName;
}

function onFragmentChecked(checkbox, fragmentId, fragmentTitle) {
  if (checkbox.checked)
    selectedFragments.add(fragmentId, fragmentTitle);
  else 
    selectedFragments.remove(fragmentId);
}

var fragmentOps = {
  deleteRelation: function (id, relationHtml, relationContainerHtml) {
    if (!window.confirm(messages["confirm-delete-relation"])) 
      return false;
    
    ajaxCommand("delete-relation", {"id": id});
    relationHtml.fadeOut("slow", function() {
      if (relationContainerHtml != null && relationHtml.siblings().size() == 0)
        relationContainerHtml.remove();
      else
        relationHtml.remove();
    });
  },
  
  removeTag: function (fragmentId, tagName) {
    if (!window.confirm(messages["confirm-remove-tag"] + ' : "' + tagName + '"')) 
      return false;
      
    var fm = document.forms['removeTagForm'];
    fm.fragmentId.value = fragmentId;
    fm.tagName.value = tagName;
    fm.submit();
  },
  
  addTag: function (fragmentId, tagName) {
    var fm = document.forms['addTagForm'];
    fm.fragmentId.value = fragmentId;
    fm.tagName.value = tagName;
    fm.submit();
  },
  
  removeBookmark: function(fragmentId) {
    if (!window.confirm(messages["confirm-remove-bookmark"])) 
      return false;
      
    var fm = document.forms['removeBookmarkForm'];
    fm.fragmentId.value = fragmentId;
    fm.submit();
  }
};



//
// Fragment highlighting
//
function highlightFragment(id, baseSelector) {
  var selector = ".fragment-header-" + id;
  if (baseSelector != null) selector = baseSelector + " " + selector;
  jQuery(selector).fadingHighlight("#ff9900");
}



//
// Content Toggle
//
function ContentToggle(toggleButton) {
	this.toggleButton = jQuery(toggleButton);
	this.toggleSpan = this.toggleButton.closest("span.fragment-content-toggle");
	this.fragment = new Fragment(toggleButton);
}
ContentToggle.CLOSED = "down";
ContentToggle.OPENED = "up";
ContentToggle.onContentToggleClick = function(toggle, id) {
	var toggle = new ContentToggle(toggle);
	
  if (toggle.isDisabled()) return;
  
  if (toggle.isClosed()) {
  	toggle.setDisabled(true);
    var loadIcon = toggle.loading();
    toggle.setOpened();
    
    jQuery.get("html/fragment-body-row.htm", {"id" : id}, function(html) {
    	toggle.fragment.setBodyRow(html);
      loadIcon.remove();
      toggle.setDisabled(false);
      prettyPrint();
    });
  }
  else if (toggle.isOpened()) {
  	toggle.fragment.bodyRow().remove();
    toggle.setClosed();
  }
};
ContentToggle.onAllContentToggleClick = function(toggle) {
	var toggle = new ContentToggle(toggle);
  if (toggle.isClosed()) {
    jQuery(".fragment-content-toggle img[src*='" + ContentToggle.CLOSED + "']").closest("a").click();
    toggle.setOpened();
  }
  else if (toggle.isOpened()) {
    jQuery(".fragment-content-toggle img[src*='" + ContentToggle.OPENED + "']").closest("a").click();
    toggle.setClosed();
  }
};
ContentToggle.prototype = {
	isDisabled: function() {
		return this.toggleButton.hasDisabledFlag();
	},
	
	setDisabled: function(disabled) {
		if (disabled)
			this.toggleButton.setDisabledFlag();
		else
			this.toggleButton.deleteDisabledFlag();
	},
	
	loading: function() {
		return this.toggleSpan.putLoadingIcon("margin: -2px; margin-left: 5px;");
	},
	
	buttonImg: function() {
		return this.toggleButton.children("img");
	},
	
	buttonImgSrc: function() {
		return this.buttonImg().attr("src");
	},
	
	isClosed: function() {
    return this.buttonImgSrc().indexOf(ContentToggle.CLOSED) != -1;
  },
  
  isOpened: function() {
    return this.buttonImgSrc().indexOf(ContentToggle.OPENED) != -1;
  },
  
  setOpened: function() {
    var img = this.buttonImg();
    img.attr("src", img.attr("src").replace(ContentToggle.CLOSED, ContentToggle.OPENED));
  },
  
  setClosed: function() {
    var img = this.buttonImg();
    img.attr("src", img.attr("src").replace(ContentToggle.OPENED, ContentToggle.CLOSED));
  }
};



//
// Fragment Tree
//
var FragmentTree = {
  COLLAPSED: "plus",
  EXPANDED: "minus",
  
  onNodeToggleClick: function(toggle, id) {
    if (jQuery(toggle).hasDisabledFlag()) return;
  
    var li = jQuery(toggle).closest("li");
    var icon = jQuery(toggle).children("img");
    var iconSrc = icon.attr("src");
    
    // Expand
    if (iconSrc.indexOf(this.COLLAPSED) != -1) {
      jQuery(toggle).setDisabledFlag();
      icon.attr("src", iconSrc.replace(this.COLLAPSED, this.EXPANDED));
      var loadIcon = jQuery(li).putLoadingIcon("margin:5px");
      jQuery.get("html/fragment-child-nodes.htm", {"id" : id}, function(childrenHtml) {
        li.append(childrenHtml);
        loadIcon.remove();
        jQuery(toggle).deleteDisabledFlag();
      });
    }
    // Collapse
    else if (iconSrc.indexOf(this.EXPANDED) != -1) {
      icon.attr("src", iconSrc.replace(this.EXPANDED, this.COLLAPSED));
      li.children("ul").remove();
    }
  },
  
  enableSortable: function(parentId) {
    jQuery(".sortable-children").sortable({
      update: function(event, ui) {
        var children = jQuery(this);
        var childOrder = children.sortable('toArray');
        var processingIcon = jQuery(
          '<span><img src="images/load.gif" border="0"/><\/span>')
            .appendTo(jQuery("#processing-children"));
        jQuery.ajax({
          type: "POST",
          url: "command/update-child-relation-priorities.htm",
          data: "id=" + parentId + "&" + jQuery(this).sortable('serialize'),
          success: function(response) {
            if (response == "error") children.sortable('cancel');
            processingIcon.remove();
          }
        });
      }
    });
    jQuery(".sortable-children").disableSelection();
    jQuery("table.fragment-root-node").css("cursor", "move");
    jQuery(".fragment-root-node .root-header-cell .fragment-header")
      .prepend('<img class="sortable-icon" src="images/sortable.png" border="0" alt=""/>');
  },
  
  disableSortable: function() {
    jQuery(".sortable-children").sortable("destroy");
    jQuery(".sortable-children").enableSelection();
    jQuery("table.fragment-root-node").css("cursor", "auto");
    jQuery(".fragment-root-node .sortable-icon").remove();
  }
};

