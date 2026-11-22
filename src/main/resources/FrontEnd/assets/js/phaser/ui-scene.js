(function(){
  class UIScene extends Phaser.Scene {
    constructor(){
      super('UIScene');
      this.errorText = null;
      this.status = { errorText: '' };
    }

    create(){
      this.errorText = this.add.text(18, 14, '', {
        fontFamily: 'Be Vietnam Pro, sans-serif',
        fontSize: '13px',
        color: '#ffd6d1',
        backgroundColor: 'rgba(76,19,12,.62)',
        padding: { x: 10, y: 8 },
        wordWrap: { width: 720 }
      }).setDepth(30).setVisible(false);
      this.events.on('set-ui-state', (next)=>{ Object.assign(this.status, next || {}); this.refresh(); });
      this.refresh();
    }

    refresh(){
      if (!this.errorText) return;
      const text = String(this.status.errorText || '').trim();
      if (text) {
        this.errorText.setText(text).setVisible(true);
      } else {
        this.errorText.setVisible(false);
      }
    }
  }

  window.RaidUIScene = UIScene;
})();
