package com.taskmanager.service;

import com.taskmanager.dto.ProjectDtos.*;
import com.taskmanager.entity.*;
import com.taskmanager.exception.ApiException;
import com.taskmanager.repository.ProjectMemberRepository;
import com.taskmanager.repository.ProjectRepository;
import com.taskmanager.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final UserRepository userRepository;

    @Transactional
    public ProjectDto createProject(Long currentUserId, CreateProjectRequest req) {
        User creator = userRepository.findById(currentUserId)
                .orElseThrow(() -> ApiException.notFound("User not found"));

        Project project = Project.builder()
                .name(req.getName().trim())
                .description(req.getDescription())
                .creator(creator)
                .build();
        project = projectRepository.save(project);

        ProjectMember admin = ProjectMember.builder()
                .project(project)
                .user(creator)
                .role(ProjectRole.ADMIN)
                .build();
        projectMemberRepository.save(admin);

        return toDto(project, ProjectRole.ADMIN, 1);
    }

    public List<ProjectDto> listMyProjects(Long currentUserId) {
        List<Project> projects = projectRepository.findAllByUserId(currentUserId);
        return projects.stream().map(p -> {
            ProjectMember pm = projectMemberRepository.findByProjectIdAndUserId(p.getId(), currentUserId)
                    .orElseThrow(() -> ApiException.forbidden("Not a member of project " + p.getId()));
            int memberCount = projectMemberRepository.findByProjectId(p.getId()).size();
            return toDto(p, pm.getRole(), memberCount);
        }).toList();
    }

    public ProjectDetailDto getProject(Long currentUserId, Long projectId) {
        Project p = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        ProjectMember pm = projectMemberRepository.findByProjectIdAndUserId(projectId, currentUserId)
                .orElseThrow(() -> ApiException.forbidden("You are not a member of this project"));
        List<MemberDto> members = projectMemberRepository.findByProjectId(projectId).stream()
                .map(m -> MemberDto.builder()
                        .userId(m.getUser().getId())
                        .name(m.getUser().getName())
                        .email(m.getUser().getEmail())
                        .role(m.getRole())
                        .build())
                .toList();
        return ProjectDetailDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .creatorId(p.getCreator().getId())
                .creatorName(p.getCreator().getName())
                .currentUserRole(pm.getRole())
                .members(members)
                .createdAt(p.getCreatedAt())
                .build();
    }

    @Transactional
    public MemberDto addMember(Long currentUserId, Long projectId, AddMemberRequest req) {
        requireAdmin(currentUserId, projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        User toAdd = userRepository.findByEmail(req.getEmail().trim().toLowerCase())
                .orElseThrow(() -> ApiException.notFound("No user with that email"));
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, toAdd.getId())) {
            throw ApiException.conflict("User is already a member");
        }
        ProjectRole role = req.getRole() != null ? req.getRole() : ProjectRole.MEMBER;
        ProjectMember pm = ProjectMember.builder()
                .project(project)
                .user(toAdd)
                .role(role)
                .build();
        projectMemberRepository.save(pm);
        return MemberDto.builder()
                .userId(toAdd.getId())
                .name(toAdd.getName())
                .email(toAdd.getEmail())
                .role(role)
                .build();
    }

    @Transactional
    public void removeMember(Long currentUserId, Long projectId, Long userId) {
        requireAdmin(currentUserId, projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        if (project.getCreator().getId().equals(userId)) {
            throw ApiException.badRequest("The project creator cannot be removed");
        }
        ProjectMember pm = projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> ApiException.notFound("Member not found"));
        projectMemberRepository.delete(pm);
    }

    public ProjectMember requireMember(Long userId, Long projectId) {
        return projectMemberRepository.findByProjectIdAndUserId(projectId, userId)
                .orElseThrow(() -> ApiException.forbidden("You are not a member of this project"));
    }

    public void requireAdmin(Long userId, Long projectId) {
        ProjectMember pm = requireMember(userId, projectId);
        if (pm.getRole() != ProjectRole.ADMIN) {
            throw ApiException.forbidden("Only project admins can perform this action");
        }
    }

    private ProjectDto toDto(Project p, ProjectRole role, int memberCount) {
        return ProjectDto.builder()
                .id(p.getId())
                .name(p.getName())
                .description(p.getDescription())
                .creatorId(p.getCreator().getId())
                .creatorName(p.getCreator().getName())
                .currentUserRole(role)
                .memberCount(memberCount)
                .createdAt(p.getCreatedAt())
                .build();
    }
}
