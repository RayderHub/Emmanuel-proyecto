import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
    selector: 'app-user',
    standalone: true,
    imports: [RouterLink, ButtonModule, CardModule, Sidebar],
    templateUrl: './user.html',
    styleUrl: './user.css'
})
export class User { }