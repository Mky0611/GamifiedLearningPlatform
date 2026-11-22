(function(){
  class RaidCursorSystem {
    constructor(root){
      this.root = root;
      this.cursor = document.getElementById('cursorFx');
      this.state = 'move';
      if (!this.cursor) return;
      root.addEventListener('mousemove', this.onMove.bind(this));
      root.addEventListener('mouseleave', ()=>this.setState('move'));
    }

    onMove(event){
      if (!this.cursor) return;
      this.cursor.style.left = `${event.clientX}px`;
      this.cursor.style.top = `${event.clientY}px`;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target) return this.setState('move');
      if (target.closest('[aria-disabled="true"], .is-disabled, [data-cursor="forbidden"]')) return this.setState('forbidden');
      if (target.closest('a, button, [role="button"], .board-tile, .clickable')) return this.setState('pointer');
      return this.setState('move');
    }

    setState(state){
      if (!this.cursor || this.state === state) return;
      this.state = state;
      this.cursor.dataset.state = state;
    }
  }

  window.RaidCursorSystem = RaidCursorSystem;
})();
