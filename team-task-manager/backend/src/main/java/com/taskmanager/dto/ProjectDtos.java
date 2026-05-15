package com.taskmanager.dto;

import com.taskmanager.entity.ProjectRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

public class ProjectDtos {

    @Data
    public static class CreateProjectRequest {
        @NotBlank @Size(min = 2, max = 100)
        private String name;
        @Size(max = 1000)
        private String description;
    }

    @Data
    public static class AddMemberRequest {
        @NotBlank
        private String email;
        private ProjectRole role; // optional; default MEMBER
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MemberDto {
        private Long userId;
        private String name;
        private String email;
        private ProjectRole role;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ProjectDto {
        private Long id;
        private String name;
        private String description;
        private Long creatorId;
        private String creatorName;
        private ProjectRole currentUserRole;
        private Integer memberCount;
        private Instant createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ProjectDetailDto {
        private Long id;
        private String name;
        private String description;
        private Long creatorId;
        private String creatorName;
        private ProjectRole currentUserRole;
        private List<MemberDto> members;
        private Instant createdAt;
    }
}
