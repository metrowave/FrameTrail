/**
 * @module Player
 */


/**
 * I am the CodeSnippetsController. I am responsible for managing all the {{#crossLink "CodeSnippet"}}codeSnippets{{/crossLink}}
 * in the current {{#crossLink "HypervideoModel"}}HypervideoModel{{/crossLink}}, and for displaying them for viewing and editing.
 *
 * @class CodeSnippetsController
 * @static
 */



FrameTrail.defineModule('CodeSnippetsController', function(){


    var codeSnippets       = FrameTrail.module('HypervideoModel').codeSnippets, // can be shadowed be function local vars
        ViewVideo          = FrameTrail.module('ViewVideo'),
        codeSnippetInFocus = null;


    /**
     * I tell all codeSnippets in the 
     * {{#crossLink "HypervideoModel/codeSnippets:attribute"}}HypervideoModel/codeSnippets attribute{{/crossLink}}
     * to render their elements into the DOM.
     * @method initController
     */
    function initController() {

        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;
        
        for (var i = 0; i < codeSnippets.length; i++) {

            codeSnippets[i].renderTimelineInDOM();
            codeSnippets[i].initCodeSnippetFunction();

        }

    };



    /**
     * I remove all tileElements and codeSnippetElements from the DOM and then
     * re-append them again.
     *
     * This has the purpose that the DOM elements must appear in a sorted order by their start time. So this method has to called
     * after the user has finished editing.
     *
     * @method rearrangeTilesAndContent
     */
    function rearrangeTilesAndContent() {

        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;
        
        for (var i = 0; i < codeSnippets.length; i++) {

            codeSnippets[i].initCodeSnippetFunction();

        }


    };


    /**
     * I am a central method of the CodeSnippetsController.
     * I am called from the update functions inside the HypervideoController
     * and I set the activeState of the codeSnippets according to the current time.
     *
     * @method updateStatesOfCodeSnippets
     * @param {Number} currentTime
     */
    function updateStatesOfCodeSnippets(currentTime) {

        var codeSnippet;

        for (var idx in codeSnippets) {

            codeSnippet = codeSnippets[idx];

            if (    codeSnippet.data.start <= currentTime
                 && codeSnippet.data.start+2 >= currentTime) {

                if (!codeSnippet.activeState && !codeSnippetInFocus) {

                    codeSnippet.setActive();

                }

            } else {

                if (codeSnippet.activeState) {

                    codeSnippet.setInactive();

                }

            }

        }

        if (codeSnippetInFocus && !codeSnippetInFocus.activeState) {
            // don't execute custom code when editing snippet
            //codeSnippetInFocus.setActive();
        }


    };


    /**
     * When we are in the editMode annotations, the timeline should
     * show all timeline elements stacked, which is what I do.
     * @method stackTimelineView
     */
    function stackTimelineView() {
        
        ViewVideo.CodeSnippetTimeline.CollisionDetection({spacing:0, includeVerticalMargins:true});
        ViewVideo.adjustLayout();
        ViewVideo.adjustHypervideo();

    };


    /**
     * When we are in the editMode annotations, the timeline should
     * show all timeline elements stacked. After leaving this mode,
     * I have to reset the timelineElements and the timeline to their normal
     * layout.
     * @method resetTimelineView
     * @private
     */
    function resetTimelineView() {
        
        ViewVideo.CodeSnippetTimeline.css('height', '');
        ViewVideo.CodeSnippetTimeline.children('.timelineElement').css({
            top:    '',
            right:  '',
            bottom: '',
            height: ''
        });

    };



    /**
     * When the editMode 'codesnippets' was entered, the #EditingOptions area
     * should show two tabs: 
     * * a list of (draggable) thumbnails with available hypervideos
     * * a text form, where the user can manually input a link URL
     *
     * @method initEditOptions
     * @private
     */
    function initEditOptions() {

        ViewVideo.EditingOptions.empty();


        var hypervideos = FrameTrail.module('Database').hypervideos,
            thumb,

            codeSnippetEditingOptions = $('<div id="CodeSnippetEditingTabs">'
                                    +   '    <ul>'
                                    +   '        <li>'
                                    +   '            <a href="#CodeSnippetlist">Add Custom Code</a>'
                                    +   '        </li>'
                                    +   '    </ul>'
                                    +   '    <div id="CodeSnippetlist">'
                                    +   '    </div>'
                                    +   '</div>')
                                    .tabs({
                                        heightStyle: "fill"
                                    }),

            codeSnippetList = codeSnippetEditingOptions.find('#CodeSnippetlist');


        /* Append custom code snippet element to 'Custom Code Snippet' tab */
        // TODO: Move to separate function
        var codeSnippetElement = $('<div class="codeSnippetElement" data-type="codesnippet">'
                   + '                  <div class="codeSnippetTitle">Custom Code Snippet</div>'
                   + '              </div>');

        codeSnippetElement.draggable({
            containment:    '#MainContainer',
            helper:         'clone',
            revert:         'invalid',
            revertDuration: 100,
            appendTo:       'body',
            distance:       10,
            zIndex:         1000,

            start: function( event, ui ) {
                ui.helper.css({
                    top: $(event.currentTarget).offset().top + "px",
                    left: $(event.currentTarget).offset().left + "px",
                    width: $(event.currentTarget).width() + "px",
                    height: $(event.currentTarget).height() + "px"
                });
                $(event.currentTarget).addClass('dragPlaceholder');
            },
            
            stop: function( event, ui ) {
                $(event.target).removeClass('dragPlaceholder');
            }

        });

        codeSnippetList.append(codeSnippetElement);
        
        ViewVideo.EditingOptions.append(codeSnippetEditingOptions);

    };


    /**
     * When the editMode 'codesnippets' has been entered, the 
     * codeSnippet timeline should be droppable for new items
     * (from the tab of available hypervideos, see {{#crossLink "CodeSnippetsController/initEditOptions:method"}}CodeSnippetsController/initEditOptions{{/crossLink}}).
     * A drop event should trigger the process of creating a new codeSnippet.
     * My parameter is true or false to activate or deactivate this behavior.
     * @method makeTimelineDroppable
     * @param {Boolean} active
     */
    function makeTimelineDroppable(active) {

        if (active) {

            ViewVideo.CodeSnippetTimeline.droppable({
                accept:         '.codeSnippetElement',
                activeClass:    'droppableActive',
                hoverClass:     'droppableHover',
                tolerance:      'touch',

                over: function( event, ui ) {
                    ViewVideo.PlayerProgress.find('.ui-slider-handle').addClass('highlight');
                },

                out: function( event, ui ) {
                    ViewVideo.PlayerProgress.find('.ui-slider-handle').removeClass('highlight');
                },

                drop: function( event, ui ) {

                    var codeSnippetTitle = ui.helper.find('.codeSnippetTitle').text(),
                        startTime        = FrameTrail.module('HypervideoController').currentTime,

                        newCodeSnippet = FrameTrail.module('HypervideoModel').newCodeSnippet({
                            "start":   startTime,
                            "name":    codeSnippetTitle,
                            "snippet": 'console.log("Hello, I am a Code Snippet");'
                        });

                    
                    newCodeSnippet.renderTimelineInDOM();
                    rearrangeTilesAndContent();

                    newCodeSnippet.startEditing();
                    updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);
                    setCodeSnippetInFocus(newCodeSnippet);

                    stackTimelineView();
                    
                    ViewVideo.PlayerProgress.find('.ui-slider-handle').removeClass('highlight');

                    //TODO: Check if this is the right place
                    //FrameTrail.module('HypervideoModel').newUnsavedChange('codeSnippets');


                }

            });


        } else {


            ViewVideo.CodeSnippetTimeline.droppable('destroy');

        }

    }



    /**
     * When a codeSnippet is set into focus, I have to tell 
     * the old codeSnippet in the var codeSnippetInFocus, that it
     * is no longer in focus. Then I store the codeSnippet (or null)
     * from my parameter in the var codeSnippetInFocus, and inform it 
     * about it.
     * @method setCodeSnippetInFocus
     * @param {CodeSnippet} codeSnippet
     * @private
     */
    function setCodeSnippetInFocus(codeSnippet) {


        if (codeSnippetInFocus) {
            
            codeSnippetInFocus.permanentFocusState = false;
            codeSnippetInFocus.removedFromFocus();

        }

        codeSnippetInFocus = codeSnippet;
        
        if (codeSnippetInFocus) {
            codeSnippetInFocus.gotInFocus();
        }

        updateStatesOfCodeSnippets(FrameTrail.module('HypervideoController').currentTime);

        return codeSnippet;


    };

    


    /**
     * I listens to the global state 'editMode'.
     *
     * If we enter the editMode "codesnippets" I prepare all codeSnippets for editing, prepare the timeline
     * and the "editOptions" interface.
     *
     * When leaving I reset them.
     *
     * @method toggleEditMode
     * @param {String} editMode
     * @param {String} oldEditMode
     */
    function toggleEditMode(editMode, oldEditMode) {

        var codeSnippets = FrameTrail.module('HypervideoModel').codeSnippets;


        if(editMode === 'codesnippets' && oldEditMode !== 'codesnippets') {

            for (var idx in codeSnippets) {

                codeSnippets[idx].startEditing();

            }

            stackTimelineView();
            initEditOptions();
            makeTimelineDroppable(true);
            


        } else if (oldEditMode === 'codesnippets' && editMode !== 'codesnippets') {

            for (var idx in codeSnippets) {

                codeSnippets[idx].stopEditing();

            }

            setCodeSnippetInFocus(null);
            resetTimelineView();
            rearrangeTilesAndContent();
            makeTimelineDroppable(false);       

        }

    }


    /**
     * I react to changes in the global state "viewSize" (which is triggerd by a resize event of the window).
     * @method changeViewSize
     */
    function changeViewSize() {

        

    }


    /**
     * I react to changes in the global state viewSizeChanged.
     * The state changes after a window resize event 
     * and is meant to be used for performance-heavy operations.
     *
     * @method onViewSizeChanged
     * @private
     */
    function onViewSizeChanged() {

        

    }


    /**
     * I react to changes in the global state "sidebarOpen".
     * @method toggleSidebarOpen
     */
    function toggleSidebarOpen() {

        

    }


    /**
     * I open the codeSnippetElement of a codeSnippet in the codeSnippetContainer.
     *
     * If my parameter is null, I close the codeSnippetContainer.
     *
     * @method setOpenedCodeSnippet
     * @param {CodeSnippet} codeSnippet
     */
    function setOpenedCodeSnippet(codeSnippet) {

        openedCodeSnippet = codeSnippet

        for (var idx in codeSnippets) {

            codeSnippets[idx].codeSnippetElement.removeClass('open');
            codeSnippets[idx].tileElement.removeClass('open');

            codeSnippets[idx].codeSnippetElement.children('iframe').attr('src', '');

        }

        if (codeSnippet) {

            // randomVersion allows to use the same iFrame src several times
            var randomVersion  = Math.round(Math.random() * (100 - 1) + 1),
                fragmentSplit  = codeSnippet.data.href.split('#'),
                randomizedLink = fragmentSplit[0] + '&v=' + randomVersion + '#' + fragmentSplit[1];
            
            codeSnippet.codeSnippetElement.children('iframe').attr('src', randomizedLink);

            codeSnippet.codeSnippetElement.addClass('open');
            codeSnippet.tileElement.addClass('open');
            ViewVideo.shownDetails = 'codeSnippets';

        } else {

            ViewVideo.shownDetails = null;

        }

    }

    /**
     * I am the starting point for the process of deleting 
     * a codeSnippet. I call other necessary methods for it.
     * @method deleteCodeSnippet
     * @param {CodeSnippet} codeSnippet
     */
    function deleteCodeSnippet(codeSnippet) {

        setCodeSnippetInFocus(null);
        codeSnippet.removeFromDOM();
        FrameTrail.module('HypervideoModel').removeCodeSnippet(codeSnippet);
        stackTimelineView();

    }

        
    /**
     * I react to changes in the global state "viewMode".
     *
     * @method toggleViewMode
     * @param {String} viewMode
     * @param {String} oldViewMode
     */
    function toggleViewMode(viewMode, oldViewMode){

        

    }


    return {

        onChange: {
            editMode:        toggleEditMode,
            viewSize:        changeViewSize,
            viewSizeChanged: onViewSizeChanged,
            sidebarOpen:     toggleSidebarOpen,
            viewMode:        toggleViewMode
        },

        initController:             initController,
        updateStatesOfCodeSnippets:   updateStatesOfCodeSnippets,
        stackTimelineView:          stackTimelineView,
        deleteCodeSnippet:            deleteCodeSnippet,

        /**
         * I hold the currently opened codeSnippet (or null, when there is no opened snippet).
         * I use the {{#crossLink "CodeSnippetsController/setOpenedLink:method"}}CodeSnippetsController/setOpenedLink(){{/crossLink}}.
         * @attribute openedLink
         * @type CodeSnippet
         */
        get openedCodeSnippet()              { return openedCodeSnippet                 },
        set openedCodeSnippet(codeSnippet)   { return setOpenedCodeSnippet(codeSnippet) },

        /**
         * I hold the codeSnippet which is "in focus" (or null, when there is no snippet in focus).
         * I use the {{#crossLink "CodeSnippetsController/setCodeSnippetInFocus:method"}}CodeSnippetsController/setCodeSnippetInFocus(){{/crossLink}}.
         * @attribute codeSnippetInFocus
         * @type CodeSnippet
         */
        set codeSnippetInFocus(codeSnippet) { return setCodeSnippetInFocus(codeSnippet) },
        get codeSnippetInFocus()            { return codeSnippetInFocus               }


    };

});