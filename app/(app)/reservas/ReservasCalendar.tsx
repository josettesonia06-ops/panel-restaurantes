"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

type Props = {
  events: any[];
  onEventClick: (id: string) => void;
};

export default function ReservasCalendar({ events, onEventClick }: Props) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay",
      }}
      height="auto"
      nowIndicator={true}
      firstDay={1}
      events={events}
      moreLinkClick="day"
      moreLinkText="más"
      eventTimeFormat={{
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }}
      slotMinTime="08:00:00"
      slotMaxTime="24:00:00"
      allDaySlot={false}
      eventClick={(info) => onEventClick(info.event.id)}
      eventClassNames={(arg) => {
        const estado = (arg.event.extendedProps as any)?.estado as
          | "confirmada"
          | "pendiente"
          | "cancelada"
          | undefined;

        const atendida = (arg.event.extendedProps as any)?.atendida as
          | boolean
          | null
          | undefined;

        const classes = ["rounded-md", "border", "text-xs", "px-1", "py-0.5"];

        if (estado === "cancelada") {
          classes.push("bg-red-50", "border-red-200", "text-red-700");
          return classes;
        }

        if (estado === "pendiente") {
          classes.push("bg-yellow-50", "border-yellow-200", "text-yellow-800");
          return classes;
        }

        if (atendida === true) {
          classes.push("bg-green-50", "border-green-200", "text-green-800");
          return classes;
        }

        classes.push("bg-blue-50", "border-blue-200", "text-blue-800");
        return classes;
      }}
    />
  );
}
