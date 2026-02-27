import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [RouterLink, ButtonModule],
    templateUrl: './sidebar.html',
    styleUrl: './sidebar.css'
})
export class Sidebar { }