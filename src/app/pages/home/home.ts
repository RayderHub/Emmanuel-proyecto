import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Sidebar } from '../../components/sidebar/sidebar';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [RouterLink, Sidebar],
    templateUrl: './home.html',
    styleUrl: './home.css'
})
export class Home { }
