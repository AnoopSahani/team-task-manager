package com.taskmanager.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * Forwards non-API, non-static routes to index.html so React Router can handle them.
 */
@Controller
public class SpaForwardController {

    @GetMapping(value = {
            "/",
            "/login",
            "/signup",
            "/projects",
            "/projects/**",
            "/dashboard"
    })
    public String forward() {
        return "forward:/index.html";
    }
}
