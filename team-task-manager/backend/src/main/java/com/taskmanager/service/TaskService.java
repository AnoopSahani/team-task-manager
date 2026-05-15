package com.taskmanager.service;

import com.taskmanager.dto.TaskDtos.*;
import com.taskmanager.entity.*;
import com.taskmanager.exception.ApiException;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.TaskRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true) 
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectService projectService;

    @Transactional
    public TaskDto createTask(Long currentUserId, Long projectId, CreateTaskRequest req) {
        projectService.requireAdmin(currentUserId, projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        User creator = userRepository.findById(currentUserId).orElseThrow();

        User assignee = null;
        if (req.getAssigneeId() != null) {
            assignee = userRepository.findById(req.getAssigneeId())
                    .orElseThrow(() -> ApiException.notFound("Assignee not found"));
            if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, assignee.getId())) {
                throw ApiException.badRequest("Assignee is not a member of this project");
            }
        }

        Task t = Task.builder()
                .title(req.getTitle().trim())
                .description(req.getDescription())
                .dueDate(req.getDueDate())
                .priority(req.getPriority() != null ? req.getPriority() : TaskPriority.MEDIUM)
                .status(TaskStatus.TODO)
                .project(project)
                .assignee(assignee)
                .createdBy(creator)
                .build();
        return toDto(taskRepository.save(t));
    }

    public List<TaskDto> listProjectTasks(Long currentUserId, Long projectId) {
        projectService.requireMember(currentUserId, projectId);
        return taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId).stream()
                .map(this::toDto).toList();
    }

    @Transactional
    public TaskDto updateTask(Long currentUserId, Long taskId, UpdateTaskRequest req) {
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
        ProjectMember pm = projectService.requireMember(currentUserId, t.getProject().getId());
        boolean isAdmin = pm.getRole() == ProjectRole.ADMIN;
        boolean isAssignee = t.getAssignee() != null && t.getAssignee().getId().equals(currentUserId);

        // Members can only update status of tasks assigned to them. Admins can update anything.
        if (!isAdmin) {
            if (!isAssignee) {
                throw ApiException.forbidden("You can only update tasks assigned to you");
            }
            // Members are limited to status updates; ignore other fields silently for safety.
            if (req.getStatus() != null) t.setStatus(req.getStatus());
            return toDto(taskRepository.save(t));
        }

        if (req.getTitle() != null && !req.getTitle().isBlank()) t.setTitle(req.getTitle().trim());
        if (req.getDescription() != null) t.setDescription(req.getDescription());
        if (req.getDueDate() != null) t.setDueDate(req.getDueDate());
        if (req.getPriority() != null) t.setPriority(req.getPriority());
        if (req.getStatus() != null) t.setStatus(req.getStatus());
        if (req.getAssigneeId() != null) {
            if (req.getAssigneeId() == 0) {
                t.setAssignee(null);
            } else {
                User assignee = userRepository.findById(req.getAssigneeId())
                        .orElseThrow(() -> ApiException.notFound("Assignee not found"));
                if (!projectMemberRepository.existsByProjectIdAndUserId(t.getProject().getId(), assignee.getId())) {
                    throw ApiException.badRequest("Assignee is not a member of this project");
                }
                t.setAssignee(assignee);
            }
        }
        return toDto(taskRepository.save(t));
    }

    @Transactional
    public TaskDto updateStatus(Long currentUserId, Long taskId, UpdateStatusRequest req) {
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
        ProjectMember pm = projectService.requireMember(currentUserId, t.getProject().getId());
        boolean isAdmin = pm.getRole() == ProjectRole.ADMIN;
        boolean isAssignee = t.getAssignee() != null && t.getAssignee().getId().equals(currentUserId);
        if (!isAdmin && !isAssignee) {
            throw ApiException.forbidden("Only the assignee or an admin can update task status");
        }
        if (req.getStatus() == null) throw ApiException.badRequest("Status is required");
        t.setStatus(req.getStatus());
        return toDto(taskRepository.save(t));
    }

    @Transactional
    public void deleteTask(Long currentUserId, Long taskId) {
        Task t = taskRepository.findById(taskId)
                .orElseThrow(() -> ApiException.notFound("Task not found"));
        projectService.requireAdmin(currentUserId, t.getProject().getId());
        taskRepository.delete(t);
    }

    public DashboardDto getDashboard(Long currentUserId, Long projectId) {
        projectService.requireMember(currentUserId, projectId);
        List<Task> tasks = taskRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        LocalDate today = LocalDate.now();

        Map<String, Long> byStatus = new LinkedHashMap<>();
        byStatus.put("TODO", 0L);
        byStatus.put("IN_PROGRESS", 0L);
        byStatus.put("DONE", 0L);
        for (Task t : tasks) byStatus.merge(t.getStatus().name(), 1L, Long::sum);

        long overdue = tasks.stream()
                .filter(t -> t.getDueDate() != null
                        && t.getStatus() != TaskStatus.DONE
                        && t.getDueDate().isBefore(today))
                .count();

        long mine = tasks.stream()
                .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(currentUserId))
                .count();

        Map<Long, List<Task>> byUser = tasks.stream()
                .filter(t -> t.getAssignee() != null)
                .collect(Collectors.groupingBy(t -> t.getAssignee().getId()));

        List<TasksPerUserDto> perUser = byUser.entrySet().stream().map(e -> {
            List<Task> list = e.getValue();
            User u = list.get(0).getAssignee();
            return TasksPerUserDto.builder()
                    .userId(u.getId())
                    .userName(u.getName())
                    .total(list.size())
                    .todo(list.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count())
                    .inProgress(list.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count())
                    .done(list.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count())
                    .build();
        }).sorted(Comparator.comparingLong(TasksPerUserDto::getTotal).reversed()).toList();

        return DashboardDto.builder()
                .totalTasks(tasks.size())
                .tasksByStatus(byStatus)
                .tasksPerUser(perUser)
                .overdueTasks(overdue)
                .myAssignedTasks(mine)
                .build();
    }

    private TaskDto toDto(Task t) {
        boolean overdue = t.getDueDate() != null
                && t.getStatus() != TaskStatus.DONE
                && t.getDueDate().isBefore(LocalDate.now());
        return TaskDto.builder()
                .id(t.getId())
                .title(t.getTitle())
                .description(t.getDescription())
                .dueDate(t.getDueDate())
                .priority(t.getPriority())
                .status(t.getStatus())
                .projectId(t.getProject().getId())
                .projectName(t.getProject().getName())
                .assigneeId(t.getAssignee() != null ? t.getAssignee().getId() : null)
                .assigneeName(t.getAssignee() != null ? t.getAssignee().getName() : null)
                .createdById(t.getCreatedBy().getId())
                .createdByName(t.getCreatedBy().getName())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .overdue(overdue)
                .build();
    }
}
