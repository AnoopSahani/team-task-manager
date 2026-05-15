package com.taskmanager.dto;

import com.taskmanager.entity.TaskPriority;
import com.taskmanager.entity.TaskStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class TaskDtos {

    @Data
    public static class CreateTaskRequest {
        @NotBlank @Size(min = 1, max = 200)
        private String title;
        @Size(max = 2000)
        private String description;
        private LocalDate dueDate;
        private TaskPriority priority;
        private Long assigneeId;
    }

    @Data
    public static class UpdateTaskRequest {
        private String title;
        private String description;
        private LocalDate dueDate;
        private TaskPriority priority;
        private Long assigneeId;
        private TaskStatus status;
    }

    @Data
    public static class UpdateStatusRequest {
        private TaskStatus status;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TaskDto {
        private Long id;
        private String title;
        private String description;
        private LocalDate dueDate;
        private TaskPriority priority;
        private TaskStatus status;
        private Long projectId;
        private String projectName;
        private Long assigneeId;
        private String assigneeName;
        private Long createdById;
        private String createdByName;
        private Instant createdAt;
        private Instant updatedAt;
        private Boolean overdue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardDto {
        private long totalTasks;
        private Map<String, Long> tasksByStatus;
        private List<TasksPerUserDto> tasksPerUser;
        private long overdueTasks;
        private long myAssignedTasks;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TasksPerUserDto {
        private Long userId;
        private String userName;
        private long total;
        private long todo;
        private long inProgress;
        private long done;
    }
}
