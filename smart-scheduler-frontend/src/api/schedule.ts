import apiClient from "@/services/axios";

export interface ScheduleEvent {
  id: string;
  taskId: string;
  title: string;
  startTime: string;
  endTime: string;
}

export async function getSchedule(): Promise<ScheduleEvent[]> {
  // Planner output is already normalized for the weekly timetable.
  const response = await apiClient.get<ScheduleEvent[]>("/planner/schedule");
  return response.data;
}

export async function updateScheduledTask(taskId: string, start: string, end: string) {
  // Persist block moves back onto the task so manual changes survive a reload.
  const response = await apiClient.put(`/api/tasks/${taskId}`, {
    startTime: start,
    endTime: end,
  });

  return response.data;
}
