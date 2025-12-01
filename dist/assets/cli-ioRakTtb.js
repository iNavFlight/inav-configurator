const n=`<div class="tab-cli">\r
    <div class="content_wrapper">\r
        <div class="note">\r
            <div class="note_spacer">\r
                <p i18n="cliInfo"></p>\r
            </div>\r
        </div>\r
\r
        <div class="backdrop">\r
            <div class="window">\r
                <div class="wrapper"></div>\r
            </div>\r
        </div>\r
        <div style="display:flex;align-items:center;">\r
            <textarea name="commands" i18n_placeholder="cliInputPlaceholder" rows="1" cols="0"></textarea>\r
            <a class="helpiconLink" style="margin-left:5px;margin-right:5px;" href="https://github.com/iNavFlight/inav/blob/master/docs/Cli.md" target="_blank">\r
                <div class="helpicon cf_tip" style="float:none;" data-i18n_title="cliCommandsHelp"></div>\r
            </a>            \r
        </div>\r
    </div>\r
    <div class="content_toolbar">\r
        <div class="btn save_btn" style="float: left; padding-left: 15px">\r
            <a class="msc" href="#" i18n="cliMscBtn"></a>\r
            <a class="savecmd" href="#" i18n="cliSaveSettingsBtn"></a>\r
            <a class="exit" href="#" i18n="cliExitBtn"></a>\r
        </div>\r
        <div class="btn save_btn pull-right">\r
            <a class="cliDocsBtn" href="#" i18n="cliDocsBtn" target="_blank"></a>\r
            <a class="save" href="#" i18n="cliSaveToFileBtn"></a>\r
            <a class="load" href="#" i18n="cliLoadFromFileBtn"></a>\r
            <a class="copy" href="#" i18n="cliCopyToClipboardBtn"></a>            \r
            <a class="clear" href="#" i18n="cliClearOutputHistoryBtn"></a>     \r
            <a class="diffall" href="#" i18n="cliDiffAllBtn"></a>  \r
        </div>\r
    </div>\r
\r
    <!-- Snippet preview dialog -->\r
    <div id="snippetpreviewcontent" style="display: none">\r
        <div class="note">\r
            <div class="note_spacer">\r
                <p i18n="cliConfirmSnippetNote"></p>\r
            </div>\r
        </div>\r
        <textarea id="preview" cols="120" rows="20"></textarea>\r
        <div class="default_btn">\r
            <a class="confirm" href="#" i18n="cliConfirmSnippetBtn"></a>\r
        </div>\r
    </div>\r
</div>`;export{n as default};
