package com.taskmanager.controller;

import com.taskmanager.dto.TaskDtos.*;
import com.taskmanager.security.UserPrincipal;
import com.taskmanager.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping("/projects/{projectId}/tasks")
    public ResponseEntity<TaskDto> create(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long projectId,
                                          @Valid @RequestBody CreateTaskRequest req) {
        return ResponseEntity.ok(taskService.createTask(principal.getId(), projectId, req));
    }

    @GetMapping("/projects/{projectId}/tasks")
    public ResponseEntity<List<TaskDto>> list(@AuthenticationPrincipal UserPrincipal principal,
                                              @PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.listProjectTasks(principal.getId(), projectId));
    }

    @PutMapping("/tasks/{taskId}")
    public ResponseEntity<TaskDto> update(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long taskId,
                                          @RequestBody UpdateTaskRequest req) {
        return ResponseEntity.ok(taskService.updateTask(principal.getId(), taskId, req));
    }

    @PatchMapping("/tasks/{taskId}/status")
    public ResponseEntity<TaskDto> updateStatus(@AuthenticationPrincipal UserPrincipal principal,
                                                @PathVariable Long taskId,
                                                @RequestBody UpdateStatusRequest req) {
        return ResponseEntity.ok(taskService.updateStatus(principal.getId(), taskId, req));
    }

    @DeleteMapping("/tasks/{taskId}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                       @PathVariable Long taskId) {
        taskService.deleteTask(principal.getId(), taskId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/projects/{projectId}/dashboard")
    public ResponseEntity<DashboardDto> dashboard(@AuthenticationPrincipal UserPrincipal principal,
                                                  @PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getDashboard(principal.getId(), projectId));
    }
}
