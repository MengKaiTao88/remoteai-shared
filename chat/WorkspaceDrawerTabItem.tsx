import { useRef } from 'react';
import { Dropdown } from 'antd';
import { X } from 'lucide-react';
import { useDiffText } from './diffText';
import { useThreadLongPress } from './useThreadLongPress';
import type { WorkspaceTab } from './workspaceDrawer';
import { guiLanguage } from '../localization/uiText';
import { marketText } from '../provider-market/i18n';

export function WorkspaceDrawerTabItem({ tab, tabs, selected, menuOpen, choose, close, closeTabs, setMenuOpen }: {
  tab: WorkspaceTab; tabs: WorkspaceTab[]; selected: string | null; menuOpen: boolean;
  choose: (id: string) => void; close: (id: string) => void; closeTabs: (ids: string[]) => void;
  setMenuOpen: (open: boolean) => void;
}) {
  const t = useDiffText();
  const menuText = marketText(guiLanguage());
  const button = useRef<HTMLButtonElement>(null);
  const index = tabs.findIndex(entry => entry.id === tab.id);
  const gesture = useThreadLongPress(press => {
    press.target.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
      clientX: press.x, clientY: press.y }));
  }, { nativeContextMenu: true });
  const others = tabs.filter(entry => entry.id !== tab.id).map(entry => entry.id);
  const right = tabs.slice(index + 1).map(entry => entry.id);
  const closeGroup = (ids: string[]) => { setMenuOpen(false); closeTabs(ids); };
  return <Dropdown trigger={['contextMenu']} open={menuOpen} autoFocus onOpenChange={open => {
    if (open) button.current?.focus({ preventScroll: true });
    setMenuOpen(open);
  }} overlayClassName="workspace-drawer-tab-context-menu" overlayStyle={{ maxWidth: 400 }} menu={{
    'aria-label': menuText('market.browserTabActions'),
    onKeyDown: event => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopPropagation(); setMenuOpen(false); button.current?.focus();
    },
    items: [
      { key: 'others', label: menuText('market.browserCloseOtherTabs'), disabled: !others.length,
        onClick: () => closeGroup(others) },
      { key: 'right', label: menuText('market.browserCloseRightTabs'), disabled: !right.length,
        onClick: () => closeGroup(right) },
    ],
  }}>
    <div {...gesture} className="workspace-drawer-tab" data-overflow-tab data-path={tab.id}
      data-active={selected === tab.id}>
      <button ref={button} type="button" className="workspace-drawer-tab-select" role="tab"
        aria-selected={selected === tab.id} tabIndex={selected === tab.id ? 0 : -1}
        aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => choose(tab.id)} onKeyDown={event => {
          const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -index,
            End: tabs.length - index - 1 };
          if (!(event.key in offsets)) return;
          event.preventDefault(); choose(tabs[(index + offsets[event.key] + tabs.length) % tabs.length].id);
        }}>
        {tab.icon}<span>{tab.title}</span>
      </button>
      <button type="button" className="workspace-drawer-tab-close"
        aria-label={t('client.mobile.close', { value1: tab.title })} onClick={() => close(tab.id)}><X size={14} /></button>
    </div>
  </Dropdown>;
}
