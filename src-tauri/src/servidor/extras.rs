/*
pub fn iniciar(bind_addr: Option<String>) -> io::Result<Servidor> {
    let bind_addr = bind_addr.unwrap_or_else(|| criar_url(MODELO::FECHADO, None));
    let bind_addr = bind_addr.as_str();

    let listener = TcpListener::bind(bind_addr)?;
    let bind = listener.local_addr()?;

    println!("Iniciando servidor em http://{}", bind_addr);

    let server = HttpServer::new(|| {
        App::new()
            .route("/", web::get().to(index))
            .route("/health", web::get().to(health))
            .route("/user/{id}", web::get().to(get_user))
            .route("/echo", web::post().to(echo))
    })
    .listen(listener)?
    .run();

    let handle = server.handle();

    let join = thread::spawn(move || {
        println!("Actix server thread: starting server at http://{}", bind);
        actix_web::rt::System::new().block_on(server)
    });

    Ok(Servidor {
        handle,
        thread: Some(join),
    })
}
 */