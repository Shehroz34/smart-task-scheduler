import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type { EventResizeDoneArg } from "@fullcalendar/interaction";
import timeGridPlugin from "@fullcalendar/timegrid";
import type { EventDropArg, EventInput } from "@fullcalendar/core";

interface CalendarViewProps {
  events: EventInput[];
  onEventChange: (eventChange: EventDropArg | EventResizeDoneArg) => Promise<void>;
}

function CalendarView({ events, onEventChange }: CalendarViewProps) {
  return (
    <div className="w-full overflow-hidden rounded-3xl border border-border bg-background p-3 shadow-sm sm:p-4">
      <FullCalendar
        plugins={[timeGridPlugin, dayGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        // Keep schedule blocks on their intended wall-clock hour instead of shifting
        // them by the browser's local timezone offset.
        timeZone="UTC"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "timeGridWeek,dayGridMonth",
        }}
        editable
        droppable
        selectable
        eventResizableFromStart
        allDaySlot={false}
        height="auto"
        expandRows
        events={events}
        eventDrop={onEventChange}
        eventResize={onEventChange}
        slotMinTime="06:00:00"
        slotMaxTime="23:00:00"
        dayHeaderFormat={{ weekday: "short", day: "numeric" }}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
      />
    </div>
  );
}

export default CalendarView;
