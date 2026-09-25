use smat_gate::{find_site_root, run_all_checks};
use std::process::exit;

fn main() {
    let site_root = find_site_root();
    println!("============================================================");
    println!("   SMAT MINERALS SOVEREIGN INVARIANT GATE v2.2 (RUST)      ");
    println!("   Auditoria Determinista Pre-Build y Control Anti-Fugas   ");
    println!("   Raiz del Sitio: {}", site_root.display());
    println!("============================================================");

    let reports = run_all_checks(&site_root);
    let mut all_passed = true;

    for rep in reports {
        if rep.passed {
            println!(" [PASS] {}", rep.name);
            println!("        {}", rep.details);
        } else {
            println!(" [FAIL] {}", rep.name);
            println!("        ERROR: {}", rep.details);
            all_passed = false;
        }
    }

    println!("------------------------------------------------------------");
    if all_passed {
        println!(" [EXITO] Todas las 20 compuertas soberanas pasaron al 100%.");
        println!("         El arbol estatico esta listo para compilacion.");
        println!("============================================================");
        exit(0);
    } else {
        eprintln!(" [ERROR] Fallaron una o mas compuertas. Compilacion abortada.");
        println!("============================================================");
        exit(1);
    }
}
