package com.taskmanager.controller;

import com.taskmanager.dto.ProjectDtos.*;
import com.taskmanager.security.UserPrincipal;
import com.taskmanager.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectDto> create(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestBody CreateProjectRequest req) {
        return ResponseEntity.ok(projectService.createProject(principal.getId(), req));
    }

    @GetMapping
    public ResponseEntity<List<ProjectDto>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(projectService.listMyProjects(principal.getId()));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectDetailDto> get(@AuthenticationPrincipal UserPrincipal principal,
                                                @PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProject(principal.getId(), projectId));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<MemberDto> addMember(@AuthenticationPrincipal UserPrincipal principal,
                                               @PathVariable Long projectId,
                                               @Valid @RequestBody AddMemberRequest req) {
        return ResponseEntity.ok(projectService.addMember(principal.getId(), projectId, req));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Long projectId,
                                             @PathVariable Long userId) {
        projectService.removeMember(principal.getId(), projectId, userId);
        return ResponseEntity.noContent().build();
    }
}
