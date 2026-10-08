import {MapPin, Plus} from 'lucide-react';
import {SidebarTrigger} from '@/components/ui/sidebar';

export function CalendarHeader({onSubmit}: {onSubmit: () => void}) {
  return <>
    <header className="calendar-header">
      <div className="calendar-header-leading">
        <SidebarTrigger className="calendar-header-menu" aria-label="Open calendar navigation"/>
        <div className="calendar-header-identity">
          <a className="calendar-header-brand" href="/" aria-label="FindOut! home">FindOut!</a>
          <span className="calendar-header-divider" aria-hidden="true"/>
          <a className="calendar-header-location" href="/" aria-label="Fayetteville, Arkansas — choose a location">
            <MapPin size={15} aria-hidden="true"/>
            <span>Fayetteville<span className="calendar-header-state">, AR</span></span>
          </a>
        </div>
      </div>
      <button className="primary calendar-header-submit" aria-label="Submit an event" onClick={onSubmit}>
        <Plus size={17} aria-hidden="true"/><span>Submit<span className="calendar-header-submit-extra"> an event</span></span>
      </button>
    </header>
    <p className="calendar-header-motto">Get out. Make friends. Get involved.</p>
  </>;
}
